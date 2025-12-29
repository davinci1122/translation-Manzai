import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Password verification
const APP_PASSWORD = process.env.APP_PASSWORD || 'manzai2024';

app.post('/api/verify-password', (req, res) => {
  const { password } = req.body;
  if (password === APP_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'パスワードが違います' });
  }
});

// Generate topic based on difficulty
app.post('/api/generate-topic', async (req, res) => {
  try {
    const { level } = req.body;

    const levelDescriptions: Record<string, string> = {
      easy: '誰もが共通のイメージを持つ具体的な物体（例：おにぎり、ハサミ、傘、電車など）',
      normal: '複数の要素が組み合わさった日常的な概念や場所（例：友情、動物園、誕生日、通勤など）',
      hard: '視覚化しづらい感情や、説明に工夫が必要な複雑な事象（例：断捨離、絶望、デジャブ、孤独など）'
    };

    const prompt = `あなたはミルクボーイ風の漫才ゲームのお題を生成するAIです。

難易度: ${level === 'easy' ? '初級' : level === 'normal' ? '中級' : '上級'}
条件: ${levelDescriptions[level] || levelDescriptions.normal}

以下の条件でお題となる言葉を1つ生成し、さらにその言葉を大きく分類する「カテゴリ名」も生成してください。

1. お題(topic): ユーザーが説明しがいのある具体的な言葉
2. カテゴリ(category): その言葉が含まれる大きな分類（例：お題が「コーンフレーク」なら「朝ごはん」、お題が「スマホ」なら「機械」など）

回答は必ず以下のJSON形式のみで出力してください。Markdownコードブロックは不要です。
{"topic": "おにぎり", "category": "食べ物"}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json\n?|\n?```/g, '');
    const data = JSON.parse(cleanText);

    res.json({ topic: data.topic, category: data.category });
  } catch (error) {
    console.error('Topic generation error:', error);
    res.status(500).json({ error: 'お題の生成に失敗しました' });
  }
});

// Generate Milkboy-style response
app.post('/api/respond', async (req, res) => {
  try {
    const { topic, userHint, conversationHistory, turnCount } = req.body;

    const prompt = `あなたはミルクボーイの内海さん（ツッコミ担当）です。
相方の駒場さん（ユーザー）が「オカンが好きなもの」を説明していますが、オカンはその言葉を忘れてしまいました。

【正解のお題】: ${topic}（これはユーザーには教えないでください）
【現在のターン数】: ${turnCount}

【これまでの会話】:
${conversationHistory.map((h: { role: string; content: string }) => `${h.role === 'user' ? '駒場' : '内海'}: ${h.content}`).join('\n')}

【駒場の新しいヒント】: ${userHint}

【あなたの役割】
ミルクボーイの内海さんとして、以下のスタイルで返答してください：

1. ユーザーのヒントが正解（${topic}）に近い場合：
   - 「ほな〇〇やないかい！」と肯定
   - その後、庶民的な偏見や誇張した特徴を述べる
   - 例：「パッケージの五角形がむちゃくちゃデカイやん」「法律スレスレぐらい入っとんねん」

2. ユーザーのヒントが正解から遠い場合：
   - 「ほな〇〇と違うかぁ」と否定
   - その後、否定の理由を庶民的な偏見で述べる
   - 例：「人生の最後がそれでええ訳ないもんね」「生産者さんの顔が浮かばへんのよ」

3. ${turnCount >= 5 ? 'そろそろ正解に導いてもいい頃です。「ほな〇〇やないかい！」で締めくくってください。' : ''}

【重要】
- 正解の言葉（${topic}）を直接言わないでください
- 関西弁で話してください
- 庶民的で共感できる偏見を交えてください
- 「〇〇」の部分には、ユーザーのヒントから推測される言葉を入れてください

返答のみを出力してください。`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();

    // Check if the response indicates correct answer
    const isCorrect = response.includes('やないかい') && turnCount >= 3;

    res.json({ response, isCorrect, suggestedAnswer: isCorrect ? topic : null });
  } catch (error) {
    console.error('Response generation error:', error);
    res.status(500).json({ error: '返答の生成に失敗しました' });
  }
});

// Analyze translation strategies
app.post('/api/analyze', async (req, res) => {
  try {
    const { topic, conversationHistory } = req.body;

    const strategies = [
      { id: 'amplification', name: '増幅', nameEn: 'Amplification', description: '元の意味をより強く、広く、目立たせるように言い換える' },
      { id: 'diffusion', name: '拡散', nameEn: 'Diffusion', description: 'ある言葉や意味を、別のジャンルや文脈に広げる' },
      { id: 'divergence', name: '発散', nameEn: 'Divergence', description: 'ある言葉から連想できるものを、自由にたくさん出す' },
      { id: 'deletion', name: 'ゼロユニット化', nameEn: 'Deletion', description: 'あえて何かを削除して、抜けた意味から新たな物語を引き出す' },
      { id: 'generalization', name: '一般化', nameEn: 'Generalization', description: '共通する部分を発見して、グループやカテゴリの名前に置き換える' },
      { id: 'abstraction', name: '抽象化', nameEn: 'Abstraction', description: '具体的な事例や物を、概念的な言葉に変える' },
      { id: 'ethicalization', name: '倫理化', nameEn: 'Ethicalization', description: 'すでに倫理的に意味づけられた言葉に、別の視点から新しい意味を与える' },
      { id: 'visualization', name: '視覚化', nameEn: 'Visualization', description: '言葉の内容を視覚的なイメージに変換する' },
      { id: 'concretion', name: '具体化', nameEn: 'Concretion', description: '抽象的な言葉を、具体的な場面や行動で表す' },
      { id: 'condensation', name: '凝縮', nameEn: 'Condensation', description: 'たくさんの意味や思いを、一言にギュッと詰め込む' },
      { id: 'reduction', name: '削減', nameEn: 'Reduction', description: '長い表現をそぎ落として、必要な要素だけにする' },
      { id: 'convergence', name: '収束', nameEn: 'Convergence', description: 'バラバラな視点や要素を、共通するテーマにまとめる' },
      { id: 'culturalTranslation', name: '文化的変換', nameEn: 'Cultural Translation', description: 'ある文化特有の言葉を、別の文化にも伝わる形に変える' },
      { id: 'substitution', name: '代用', nameEn: 'Substitution', description: 'ある言葉を、似た意味や役割の別の言葉に置き換える' },
      { id: 'reordering', name: '順番変え', nameEn: 'Reordering', description: '決まった言葉の順番をあえて変えて、新たな視点や関係性を生み出す' },
      { id: 'verbalization', name: '言語化', nameEn: 'Verbalization', description: '普段言葉にしていないことを、あえて言葉にする' }
    ];

    const userHints = conversationHistory
      .filter((h: { role: string }) => h.role === 'user')
      .map((h: { content: string }, i: number) => `ターン${i + 1}: ${h.content}`)
      .join('\n');

    const prompt = `あなたは翻訳学の専門家です。以下の会話を分析し、ユーザーが使用した翻訳ストラテジーを特定してください。

【お題】: ${topic}

【ユーザーのヒント一覧】:
${userHints}

【16の翻訳ストラテジー】:
${strategies.map(s => `- ${s.name}（${s.nameEn}）: ${s.description}`).join('\n')}

【分析タスク】
各ターンで、ユーザーがどの翻訳ストラテジーを使用したかを分析してください。

以下のJSON形式で出力してください：
{
  "analysis": [
    {
      "turn": 1,
      "userHint": "ユーザーのヒント",
      "strategy": "使用されたストラテジーのid",
      "strategyName": "ストラテジーの日本語名",
      "explanation": "なぜそのストラテジーと判断したかの説明（1-2文）"
    }
  ],
  "summary": "全体的な翻訳傾向のまとめ（2-3文）"
}

JSONのみを出力してください。`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      res.json(analysis);
    } else {
      throw new Error('Invalid JSON response');
    }
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: '分析に失敗しました' });
  }
});

// Generate complete manzai script
app.post('/api/generate-script', async (req, res) => {
  try {
    const { topic, conversationHistory } = req.body;

    const prompt = `あなたはミルクボーイの漫才台本作家です。以下の会話履歴を元に、完成版のミルクボーイ風漫才台本を作成してください。

【お題】: ${topic}

【会話履歴】:
${conversationHistory.map((h: { role: string; content: string }) => `${h.role === 'user' ? '駒場' : '内海'}: ${h.content}`).join('\n')}

【台本作成のルール】
1. 冒頭に「どうもー！ミルクボーイです！」を入れる
2. 駒場が「オカンが好きな〇〇があるらしいんやけど、その名前を忘れたらしくてね」で始める
3. 会話履歴を元に、より漫才らしく整える
4. 最後に「${topic}やないかい！」でオチをつける
5. 締めに「ありがとうございましたー！」を入れる

【出力形式】
駒場「セリフ」
内海「セリフ」
の形式で出力してください。`;

    const result = await model.generateContent(prompt);
    const script = result.response.text().trim();

    res.json({ script });
  } catch (error) {
    console.error('Script generation error:', error);
    res.status(500).json({ error: '台本の生成に失敗しました' });
  }
});

// Serve frontend
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
