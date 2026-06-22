import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Health Tips Generation
  app.post("/api/generate-tips", async (req, res) => {
    const { profile } = req.body;
    if (!profile) {
      return res.status(400).json({ error: "Thiếu thông tin người dùng" });
    }

    try {
      const { GoogleGenAI, Type } = await import("@google/genai");
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(400).json({ 
          error: "Vui lòng cấu hình mã khóa GEMINI_API_KEY hợp lệ trong tab **Settings (Răng cưa) > Secrets** ở góc trên bên phải của AI Studio." 
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `
        Dựa trên hồ sơ người dùng NutriCare:
        - Tên: ${profile.name}
        - Bệnh lý: ${(profile.diseases || []).join(", ")}
        - Dị ứng: ${(profile.allergies || []).join(", ")}
        - Mức độ vận động: ${profile.activityLevel}
        Cung cấp 3 bài viết/lời khuyên sức khỏe ngắn gọn, súc tích (tiếng Việt).
        Định dạng JSON: Array<{title: string, content: string, category: 'nutrition'|'lifestyle'|'warning', icon: string}>
        Sử dụng code icon từ Lucide (ví dụ: 'Apple', 'Zap', 'Activity', 'ShieldCheck', 'Moon', 'Sun', 'Wind').
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                category: { type: Type.STRING },
                icon: { type: Type.STRING }
              },
              required: ["title", "content", "category", "icon"]
            }
          }
        }
      });

      const text = response.text || "[]";
      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("Generate health tips error:", error);
      res.status(500).json({ 
        error: error.message?.includes("API key not valid")
          ? "Mã khóa GEMINI_API_KEY không hợp lệ. Vui lòng cấu hình lại trong tab **Settings > Secrets** của AI Studio."
          : error.message || "Lỗi tạo lời khuyên sức khỏe từ AI" 
      });
    }
  });

  // API Route for Meal Plan Generation
  app.post("/api/generate-meal", async (req, res) => {
    const { profile, retryCount = 0 } = req.body;
    if (!profile) {
      return res.status(400).json({ error: "Thiếu thông tin người dùng" });
    }

    try {
      const { GoogleGenAI, Type } = await import("@google/genai");
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(400).json({ 
          error: "Vui lòng cấu hình mã khóa GEMINI_API_KEY hợp lệ trong tab **Settings (Răng cưa) > Secrets** ở góc trên bên phải của AI Studio." 
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Prefer standard gemini-3.5-flash
      const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
      const currentModel = models[retryCount] || models[models.length - 1];

      const prompt = `
        Bạn là một chuyên gia dinh dưỡng y khoa (AI NutriCare).
        Hãy dựa vào hồ sơ sức khỏe người dùng sau để gợi ý thực đơn 1 ngày (Sáng, Trưa, Tối, Bữa phụ):
        - Tên: ${profile.name}
        - Tuổi: ${profile.age}
        - Cân nặng: ${profile.weight}kg, Chiều cao: ${profile.height}cm
        - Bệnh lý: ${(profile.diseases || []).join(", ")}
        - Dị ứng: ${(profile.allergies || []).join(", ")}
        - Thói quen: ${profile.habits}
        - Mức độ vận động: ${profile.activityLevel}
        - Nguyên liệu yêu thích: ${(profile.likedIngredients || []).join(", ") || "Không có"}
        - Nguyên liệu không thích: ${(profile.dislikedIngredients || []).join(", ") || "Không có"}

        Yêu cầu:
        1. Tuân thủ phác đồ dinh dưỡng cho người đang mắc các bệnh trên.
        2. Loại bỏ hoàn toàn thực phẩm gây dị ứng và ưu tiên loại bỏ các nguyên liệu không thích.
        3. Phân biệt rõ món nên ăn và món nên tránh.
        4. Tỉ lệ dinh dưỡng phù hợp với chỉ số BMI và mức vận động.
        5. Ước tính thành phần dinh dưỡng chi tiết (Calories, Protein, Carbs, Fat, Fiber, Sugar, Sodium và các Vitamin/khoáng chất quan trọng) cho từng bữa ăn.
        6. Cung cấp danh sách nguyên liệu (ingredients) chi tiết cho từng món ăn trong bữa.
        7. Ưu tiên các nguyên liệu yêu thích nhưng phải đảm bảo ĐA DẠNG món ăn để tránh nhàm chán (taste fatigue).
        8. Đảm bảo các món ăn luân phiên, không lặp lại nguyên liệu chính quá nhiều trong cùng 1 ngày và khuyến khích sự thay đổi giữa các ngày.
      `;

      const response = await ai.models.generateContent({
        model: currentModel,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              breakfast: { type: Type.STRING },
              lunch: { type: Type.STRING },
              dinner: { type: Type.STRING },
              snacks: { type: Type.STRING },
              ingredients: {
                type: Type.OBJECT,
                properties: {
                  breakfast: { type: Type.ARRAY, items: { type: Type.STRING } },
                  lunch: { type: Type.ARRAY, items: { type: Type.STRING } },
                  dinner: { type: Type.ARRAY, items: { type: Type.STRING } },
                  snacks: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["breakfast", "lunch", "dinner", "snacks"]
              },
              nutrition: {
                type: Type.OBJECT,
                properties: {
                  breakfast: {
                    type: Type.OBJECT,
                    properties: {
                      calories: { type: Type.NUMBER },
                      protein: { type: Type.NUMBER },
                      carbs: { type: Type.NUMBER },
                      fat: { type: Type.NUMBER },
                      fiber: { type: Type.NUMBER },
                      sugar: { type: Type.NUMBER },
                      sodium: { type: Type.NUMBER },
                      vitamins: {
                        type: Type.OBJECT,
                        properties: {
                          vitaminA: { type: Type.STRING },
                          vitaminC: { type: Type.STRING },
                          vitaminD: { type: Type.STRING },
                          calcium: { type: Type.STRING },
                          iron: { type: Type.STRING },
                          potassium: { type: Type.STRING }
                        }
                      }
                    },
                    required: ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"]
                  },
                  lunch: {
                    type: Type.OBJECT,
                    properties: {
                      calories: { type: Type.NUMBER },
                      protein: { type: Type.NUMBER },
                      carbs: { type: Type.NUMBER },
                      fat: { type: Type.NUMBER },
                      fiber: { type: Type.NUMBER },
                      sugar: { type: Type.NUMBER },
                      sodium: { type: Type.NUMBER },
                      vitamins: {
                        type: Type.OBJECT,
                        properties: {
                          vitaminA: { type: Type.STRING },
                          vitaminC: { type: Type.STRING },
                          vitaminD: { type: Type.STRING },
                          calcium: { type: Type.STRING },
                          iron: { type: Type.STRING },
                          potassium: { type: Type.STRING }
                        }
                      }
                    },
                    required: ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"]
                  },
                  dinner: {
                    type: Type.OBJECT,
                    properties: {
                      calories: { type: Type.NUMBER },
                      protein: { type: Type.NUMBER },
                      carbs: { type: Type.NUMBER },
                      fat: { type: Type.NUMBER },
                      fiber: { type: Type.NUMBER },
                      sugar: { type: Type.NUMBER },
                      sodium: { type: Type.NUMBER },
                      vitamins: {
                        type: Type.OBJECT,
                        properties: {
                          vitaminA: { type: Type.STRING },
                          vitaminC: { type: Type.STRING },
                          vitaminD: { type: Type.STRING },
                          calcium: { type: Type.STRING },
                          iron: { type: Type.STRING },
                          potassium: { type: Type.STRING }
                        }
                      }
                    },
                    required: ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"]
                  },
                  snacks: {
                    type: Type.OBJECT,
                    properties: {
                      calories: { type: Type.NUMBER },
                      protein: { type: Type.NUMBER },
                      carbs: { type: Type.NUMBER },
                      fat: { type: Type.NUMBER },
                      fiber: { type: Type.NUMBER },
                      sugar: { type: Type.NUMBER },
                      sodium: { type: Type.NUMBER },
                      vitamins: {
                        type: Type.OBJECT,
                        properties: {
                          vitaminA: { type: Type.STRING },
                          vitaminC: { type: Type.STRING },
                          vitaminD: { type: Type.STRING },
                          calcium: { type: Type.STRING },
                          iron: { type: Type.STRING },
                          potassium: { type: Type.STRING }
                        }
                      }
                    },
                    required: ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"]
                  }
                },
                required: ["breakfast", "lunch", "dinner", "snacks"]
              },
              aiTips: { type: Type.STRING },
              shouldAvoid: { type: Type.ARRAY, items: { type: Type.STRING } },
              shouldEat: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["breakfast", "lunch", "dinner", "snacks", "nutrition", "aiTips", "shouldAvoid", "shouldEat", "ingredients"]
          }
        }
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (error: any) {
      console.error("Generate meal plan error:", error);
      res.status(500).json({ 
        error: error.message?.includes("API key not valid")
          ? "Mã khóa GEMINI_API_KEY không hợp lệ. Vui lòng cấu hình lại trong tab **Settings > Secrets** của AI Studio."
          : error.message || "Lỗi tạo thực đơn từ AI" 
      });
    }
  });

  // API Route for AI Chat Expert
  app.post("/api/chat", async (req, res) => {
    const { messages, profile, userMessage } = req.body;
    if (!userMessage) {
      return res.status(400).json({ error: "Thiếu tin nhắn người dùng" });
    }

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(400).json({ 
          error: "Vui lòng cấu hình mã khóa GEMINI_API_KEY hợp lệ trong tab **Settings (Răng cưa) > Secrets** ở góc trên bên phải của AI Studio." 
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemPrompt = `
        Bạn là "AI NutriCare Expert" - Chuyên gia tư vấn dinh dưỡng y khoa thông minh.
        Hồ sơ người dùng hiện tại:
        - Tên: ${profile?.name || 'Người dùng'}
        - Tuổi: ${profile?.age || 'Chưa rõ'}, Giới tính: ${profile?.gender === 'male' ? 'Nam' : 'Nữ'}
        - Chỉ số: ${profile?.weight || 'Chưa rõ'}kg, ${profile?.height || 'Chưa rõ'}cm
        - Bệnh lý: ${(profile?.diseases || []).join(", ") || 'Không có'}
        - Dị ứng: ${(profile?.allergies || []).join(", ") || 'Không có'}
        - Mức độ vận động: ${profile?.activityLevel || 'Trung bình'}

        QUY TẮC PHẢN HỒI:
        1. Luôn ưu tiên an toàn thực phẩm liên quan đến bệnh lý (${(profile?.diseases || []).join(", ")}).
        2. Nếu người dùng hỏi về món ăn gây dị ứng (${(profile?.allergies || []).join(", ")}), hãy cảnh báo mạnh mẽ.
        3. Văn phong chuyên nghiệp nhưng gần gũi, sử dụng tiếng Việt.
        4. KHÔNG kê đơn thuốc. Chỉ tư vấn thực phẩm, lối sống và dinh dưỡng.
        5. Luôn nhắc nhở người dùng tham khảo ý kiến bác sĩ cho các trường hợp cấp tính.
        6. Câu trả lời ngắn gọn, súc tích, định dạng Markdown nếu cần (list, bold).
      `;

      const history = (messages || []).map((m: any) => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...history,
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          maxOutputTokens: 600,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ 
        error: error.message?.includes("API key not valid")
          ? "Mã khóa GEMINI_API_KEY không hợp lệ. Vui lòng cấu hình lại trong tab **Settings > Secrets** của AI Studio."
          : error.message || "Lỗi giao tiếp với AI" 
      });
    }
  });

  // API Route for Mood and Diet Mental Health Analysis using Gemini
  app.post("/api/analyze-mood", async (req, res) => {
    const { profile, mealPlan, logs } = req.body;
    if (!profile) {
      return res.status(400).json({ error: "Thiếu thông tin người dùng" });
    }

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(400).json({ 
          error: "Vui lòng cấu hình mã khóa GEMINI_API_KEY hợp lệ trong tab **Settings (Răng cưa) > Secrets** ở góc trên bên phải của AI Studio." 
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `
          Bạn là bác sĩ dinh dưỡng kiêm chuyên gia tâm lý học hành vi y khoa (AI NutriMind).
          Hãy phân tích dữ liệu ăn uống và ghi nhận tâm trạng (mood logs) của người bệnh sau đây để tìm mối liên hệ giữa chế độ ăn uống, bệnh lý và sức khỏe tinh thần:

          THÔNG TIN NGƯỜI BỆNH:
          - Tên: ${profile.name || 'Người dùng'}
          - Tuổi: ${profile.age || 'Chưa rõ'}
          - Giới tính: ${profile.gender || 'Chưa rõ'}
          - Bệnh lý nền: ${profile.diseases?.join(", ") || 'Không có'}
          - Thói quen: ${profile.habits || 'Không có thói quen đặc thù'}

          THỰC ĐƠN DINH DƯỠNG ĐANG ÁP DỤNG:
          - Sáng: ${mealPlan?.breakfast || 'Chưa định nghĩa thực đơn'}
          - Trưa: ${mealPlan?.lunch || 'Chưa định nghĩa thực đơn'}
          - Tối: ${mealPlan?.dinner || 'Chưa định nghĩa thực đơn'}
          - Bữa phụ: ${mealPlan?.snacks || 'Chưa định nghĩa thực đơn'}

          NHẬT KÝ TÂM TRẠNG & TUÂN THỦ (MOOD LOGS):
          ${logs && logs.length > 0 ? logs.map((l: any) => `- Bữa ${l.mealType === 'breakfast' ? 'Sáng' : l.mealType === 'lunch' ? 'Trưa' : l.mealType === 'dinner' ? 'Tối' : 'Bữa phụ'}: Trạng thái ${l.status === 'followed' ? 'Đã ăn đúng thực đơn' : l.status === 'skipped' ? 'Bỏ bữa' : 'Đã thay đổi thực phẩm'}, Tâm trạng: ${l.mood === 'happy' ? '🌟 Hạnh phúc/Sảng khoái' : l.mood === 'calm' ? '😐 Bình yên/Thư giãn' : l.mood === 'tired' ? '🥱 Mệt mỏi/Uể oải' : l.mood === 'stressed' ? '😫 Căng thẳng' : l.mood === 'anxious' ? '😰 Lo lắng/Bồn bồn' : l.mood === 'depressed' ? '😢 U uất/Buồn bã' : 'Chưa ghi nhận'}, Ghi chú/Triệu chứng: ${l.moodNote || 'Không có'}`).join("\n") : 'Chưa có nhật ký tâm trạng nào được ghi nhận cho ngày này.'}

          Yêu cầu phân tích:
          1. Đánh giá trạng thái tinh thần tổng quan của người bệnh dựa trên các loại tâm trạng (như mệt mỏi, sảng khoái, lo lắng,...) sau khi ăn.
          2. Tìm ra mối liên hệ khoa học rõ nét giữa các món ăn hoặc hoạt chất dinh dưỡng cụ thể trong thực đơn (ví dụ: thực phẩm giàu carbohydrate hấp thụ nhanh, kích thích tố, thực phẩm giàu chất xơ, đường, các dưỡng chất omega, tryptophan hay magiê...) với phản ứng tâm lý/tâm trạng của người bệnh (đặt trong ngữ cảnh các bệnh lý nền cụ thể của họ).
          3. Đưa ra giải pháp thực tế hoặc hướng dẫn chế độ ăn tiếp theo, mẹo dinh dưỡng cụ thể để tối ưu nguồn năng lượng tinh thần, giúp xoa dịu hệ thần kinh, tăng sự minh mẫn hoặc phòng chống uể oải.
          4. Trả lời bằng tiếng Việt với phong thái chuyên nghiệp của bác sĩ dinh dưỡng tâm thần học, văn phong ân cần, giàu đồng cảm, dễ hiểu và truyền động lực sống tích cực cho người bệnh. Hãy định dạng văn bản bằng Markdown thật đẹp với tiêu đề rõ ràng, các icon sinh động.
        `,
      });

      res.json({ analysis: response.text });
    } catch (error: any) {
      console.error("Gemini mood analysis error:", error);
      res.status(500).json({ 
        error: error.message?.includes("API key not valid")
          ? "Mã khóa GEMINI_API_KEY không hợp lệ. Vui lòng cấu hình lại trong tab **Settings > Secrets** của AI Studio."
          : error.message || "Lỗi phân tích tâm lý dinh dưỡng từ AI" 
      });
    }
  });

  // Use Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
