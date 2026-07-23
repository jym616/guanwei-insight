type ReviewInput = {
  author?: string;
  rating?: string;
  content: string;
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const model =
      process.env.DEEPSEEK_MODEL || "deepseek-chat";

    if (!apiKey) {
      return Response.json(
        {
          error: "服务器没有设置DeepSeek API Key",
        },
        {
          status: 500,
        }
      );
    }

    const body = await request.json();
    const reviews = body.reviews as ReviewInput[];

    if (!Array.isArray(reviews)) {
      return Response.json(
        {
          error: "评论数据格式不正确",
        },
        {
          status: 400,
        }
      );
    }

    if (reviews.length === 0) {
      return Response.json(
        {
          error: "没有可以分析的评论",
        },
        {
          status: 400,
        }
      );
    }

    // 学习阶段最多分析5条，防止误操作浪费额度
    const limitedReviews = reviews.slice(0, 5);

    const prompt = `
你是一名严谨的用户研究和产品分析专家。

请分析下面的用户评论。

你必须只输出JSON，不要输出Markdown，
不要使用代码块，不要添加任何解释。

输出格式：

{
  "results": [
    {
      "index": 0,
      "sentiment": "正面或中性或负面",
      "topic": "核心话题",
      "issue": "用户提出的核心问题",
      "plain_explanation": "用不懂专业术语的人也能理解的话解释问题",
      "urgency": 1,
      "suggestion": "给产品团队的具体建议",
      "confidence": 0.9
    }
  ]
}

规则：

1. index必须对应原评论的index。
2. urgency只能是1到5的整数。
3. confidence只能是0到1之间的小数。
4. 没有明显问题时，issue填写“无明显问题”。
5. suggestion必须具体，不要只写“优化体验”。
6. plain_explanation必须使用普通人能理解的语言解释专业术语和问题。
7. plain_explanation不能只重复topic或issue。
8. 如果评论不包含专业术语，也要用一句简单的话说明用户遇到了什么。

评论数据：

${JSON.stringify(limitedReviews)}
`;

    const response = await fetch(
      "https://api.deepseek.com/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },

        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
          response_format: {
            type: "json_object",
          },
        }),
      }
    );

    if (!response.ok) {
      const message = await response.text();

      console.error(
        "DeepSeek请求失败：",
        response.status,
        message
      );

      return Response.json(
        {
          error: `DeepSeek请求失败，状态码：${response.status}`,
        },
        {
          status: 502,
        }
      );
    }

    const deepSeekResult = await response.json();

    const content =
      deepSeekResult.choices?.[0]?.message?.content;

    if (!content) {
      return Response.json(
        {
          error: "DeepSeek没有返回分析结果",
        },
        {
          status: 502,
        }
      );
    }

    const analysis = JSON.parse(content);

    return Response.json({
      success: true,
      analyzedCount: limitedReviews.length,
      analysis,
    });
  } catch (error) {
    console.error("评论分析发生错误：", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "评论分析失败",
      },
      {
        status: 500,
      }
    );
  }
}