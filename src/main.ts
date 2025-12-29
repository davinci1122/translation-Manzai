import './style.css';
import { strategies } from './utils/strategies';

// Types
interface ConversationItem {
  role: 'user' | 'ai';
  content: string;
}

interface GameState {
  screen: 'intro' | 'game' | 'loading' | 'result';
  difficulty: 'easy' | 'normal' | 'hard' | null;
  topic: string;
  category: string;
  userName: string;
  conversationHistory: ConversationItem[];
  turnCount: number;
  isProcessing: boolean;
  currentAiBubble: string | null;
  currentUserBubble: string | null;
  script: string;
  analysis: {
    analysis: Array<{
      turn: number;
      userHint: string;
      strategy: string;
      strategyName: string;
      explanation: string;
    }>;
    summary: string;
  } | null;
}

// State
const state: GameState = {
  screen: 'intro',
  difficulty: null,
  topic: '',
  category: '',
  userName: '',
  conversationHistory: [],
  turnCount: 0,
  isProcessing: false,
  currentAiBubble: null,
  currentUserBubble: null,
  script: '',
  analysis: null
};

async function generateTopic(level: string): Promise<{ topic: string, category: string }> {
  const response = await fetch('/api/generate-topic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level })
  });
  const data = await response.json();
  return { topic: data.topic, category: data.category };
}

async function getAIResponse(userHint: string): Promise<{
  guess: string;
  isCorrect: boolean;
  responseV1: string;
  responseV2: string;
  suggestedAnswer: string | null;
}> {
  const response = await fetch('/api/respond', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: state.topic,
      userHint,
      conversationHistory: state.conversationHistory,
      turnCount: state.turnCount,
      userName: state.userName
    })
  });
  return response.json();
}

async function analyzeStrategies(): Promise<void> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: state.topic,
      conversationHistory: state.conversationHistory,
      userName: state.userName
    })
  });
  state.analysis = await response.json();
}

async function generateScript(): Promise<void> {
  const response = await fetch('/api/generate-script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: state.topic,
      conversationHistory: state.conversationHistory,
      userName: state.userName
    })
  });
  const data = await response.json();
  state.script = data.script;
}

// Render functions
function render(): void {
  const app = document.querySelector<HTMLDivElement>('#app')!;

  switch (state.screen) {
    case 'intro':
      app.innerHTML = renderIntroScreen();
      break;
    case 'game':
      app.innerHTML = renderGameScreen();
      break;
    case 'loading':
      app.innerHTML = renderLoadingScreen();
      break;
    case 'result':
      app.innerHTML = renderResultScreen();
      break;
  }

  attachEventListeners();
}

function renderJoshikimaku(): string {
  return `
    <div class="joshikimaku">
      <div class="joshikimaku-stripe black"></div>
      <div class="joshikimaku-stripe green"></div>
      <div class="joshikimaku-stripe persimmon"></div>
    </div>
  `;
}

function renderIntroScreen(): string {
  return `
    ${renderJoshikimaku()}
    <div class="intro-screen">
      <h1>翻訳漫才</h1>
      <p class="subtitle">オカンが忘れた言葉</p>
      
      <div class="username-container" style="margin-bottom: 2rem; width: 100%; max-width: 300px;">
        <label for="username-input" style="display: block; margin-bottom: 0.5rem; color: #f5f5f0;">芸名（あなたの名前）</label>
        <input type="text" id="username-input" placeholder="例：駒場" maxlength="10" 
          style="width: 100%; padding: 10px; font-size: 1rem; background: #333; border: 1px solid #c66b3d; color: #fff; border-radius: 4px;" />
      </div>

      <div class="difficulty-buttons">
        <button class="difficulty-btn easy" data-level="easy">
          <span class="level-name">初級</span>
          <span class="level-desc">身近な食べ物や道具</span>
        </button>
        <button class="difficulty-btn normal" data-level="normal">
          <span class="level-name">中級</span>
          <span class="level-desc">抽象的な概念や場所</span>
        </button>
        <button class="difficulty-btn hard" data-level="hard">
          <span class="level-name">上級</span>
          <span class="level-desc">複雑な動詞や感情</span>
        </button>
      </div>
    </div>
  `;
}

function renderGameScreen(): string {
  const lastUserMessage = state.conversationHistory.filter(h => h.role === 'user').slice(-1)[0]?.content || '';
  const lastAIMessage = state.conversationHistory.filter(h => h.role === 'ai').slice(-1)[0]?.content || '';

  const difficultyLabel = state.difficulty === 'easy' ? '初級' : state.difficulty === 'normal' ? '中級' : '上級';

  return `
    ${renderJoshikimaku()}
    <div class="game-screen">
      <div class="game-main">
        <div class="game-header">
          <h2>お題: ${state.topic} ｜ 難易度: ${difficultyLabel} ｜ ターン: ${state.turnCount}</h2>
          <button class="end-game-btn" id="end-game-btn">ゲーム終了</button>
        </div>
        
        <div class="stage-area">
          <div class="conversation-area" style="align-items: center;">
            <div class="bubble user">
              <span class="bubble-label">ボケ（${state.userName}）</span>
              <div class="bubble-content">
                ${state.currentUserBubble || (lastUserMessage || `オカンが好きな${state.category || '〇〇'}があるらしいんやけど...`)}
              </div>
            </div>

            <div class="sanpachi-mic" style="margin-bottom: 0; transform: scale(0.8);">
              <div class="mic-head"></div>
              <div class="mic-stand"></div>
            </div>

            <div class="bubble ai">
              <span class="bubble-label">ツッコミ（外海）</span>
              <div class="bubble-content ${state.isProcessing && !state.currentAiBubble ? 'typing' : ''}">
                ${state.currentAiBubble || (state.isProcessing ? '考え中' : (lastAIMessage || 'ほう、なんやて？'))}
              </div>
            </div>
          </div>
          
          <div class="input-area">
            <input type="text" id="hint-input" placeholder="特徴を入力..." maxlength="50" ${state.isProcessing ? 'disabled' : ''}>
            <button id="submit-hint-btn" ${state.isProcessing ? 'disabled' : ''}>送信</button>
          </div>
        </div>
      </div>
      
      <div class="sidebar">
        <h3>会話履歴</h3>
        <div class="history-list">
          ${[...state.conversationHistory].reverse().map(item => `
            <div class="history-item ${item.role}">
              <div class="history-item-label">${item.role === 'user' ? state.userName : '外海'}</div>
              <div>${item.content}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderLoadingScreen(): string {
  return `
    ${renderJoshikimaku()}
    <div class="loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">分析中...</div>
    </div>
  `;
}

function renderResultScreen(): string {
  return `
    ${renderJoshikimaku()}
    <div class="result-screen">
      <div class="result-header">
        <h1>漫才完了！</h1>
        <p class="topic-reveal">お題は「${state.topic}」でした！</p>
      </div>
      
      <div class="script-section">
        <h2>📜 漫才台本</h2>
        <div class="script-content">${state.script}</div>
      </div>
      
      <div class="analysis-section">
        <h2>📊 あなたの翻訳ストラテジー分析</h2>
        <div class="strategy-list">
          ${state.analysis?.analysis.map(item => {
    const strategy = strategies.find(s => s.id === item.strategy || s.name === item.strategyName);
    const color = strategy?.color || 'blue';
    return `
              <div class="strategy-item">
                <div class="strategy-badge ${color}">${item.strategyName}</div>
                <div class="strategy-details">
                  <div class="strategy-turn">ターン ${item.turn}</div>
                  <div class="strategy-hint">「${item.userHint}」</div>
                  <div class="strategy-explanation">${item.explanation}</div>
                </div>
              </div>
            `;
  }).join('') || ''}
        </div>
        ${state.analysis?.summary ? `<div class="analysis-summary">${state.analysis.summary}</div>` : ''}
      </div>
      
      <div class="result-actions">
        <button class="print-btn" id="print-btn">📄 PDFとして保存</button>
        <button class="replay-btn" id="replay-btn">🎤 もう一度遊ぶ</button>
      </div>
    </div>
  `;
}

// Helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function startOpeningSequence() {
  state.isProcessing = true;
  render();

  const category = state.category || '〇〇';
  const sequence = [
    { role: 'user', content: `いきなりですけどね　うちのオカンがね　好きな${category}があるらしいんやけど` },
    { role: 'ai', content: 'あっ　そーなんや' },
    { role: 'user', content: 'その名前をちょっと忘れたらしくてね' },
    { role: 'ai', content: `${category}の名前忘れてもうて　どうなってんねそれ` },
    { role: 'user', content: 'でまあ色々聞くんやけどな　全然分からへんねんな' },
    { role: 'ai', content: '分からへんの？　いや　ほな俺がね　ちょっと一緒に考えてあげるから　どんな特徴かってのを教えてみてよ' }
  ];

  for (const step of sequence) {
    if (step.role === 'user') {
      state.currentUserBubble = step.content;
    } else {
      state.currentAiBubble = step.content;
    }
    render();

    await sleep(1000); // 吹き出し表示時間

    // 履歴に移動
    state.conversationHistory.push({ role: step.role as 'user' | 'ai', content: step.content });
    if (step.role === 'user') {
      state.currentUserBubble = null;
    } else {
      state.currentAiBubble = null;
    }
    render();

    await sleep(500); // 次のセリフまでの間隔
  }

  state.isProcessing = false;
  render();
}

// Event handlers
function attachEventListeners(): void {
  // Difficulty buttons
  document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const usernameInput = document.getElementById('username-input') as HTMLInputElement;
      if (!usernameInput || !usernameInput.value.trim()) {
        alert('芸名を入力してください！');
        return;
      }
      state.userName = usernameInput.value.trim();

      const level = (btn as HTMLButtonElement).dataset.level as 'easy' | 'normal' | 'hard';
      state.difficulty = level;
      state.screen = 'loading';
      render();

      try {
        const data = await generateTopic(level);
        state.topic = data.topic;
        state.category = data.category;
        state.turnCount = 0;
        state.screen = 'game';
        render();
        // 自動オープニング開始
        startOpeningSequence();
      } catch (error) {
        console.error('Failed to generate topic:', error);
        alert('お題の生成に失敗しました。もう一度お試しください。');
        state.screen = 'intro';
        render();
      }
    });
  });

  // Submit hint
  const submitBtn = document.getElementById('submit-hint-btn');
  const hintInput = document.getElementById('hint-input') as HTMLInputElement;

  if (submitBtn && hintInput) {
    const handleSubmit = async () => {
      const hint = hintInput.value.trim();
      if (!hint || state.isProcessing) return;

      state.isProcessing = true;
      state.turnCount++;
      state.conversationHistory.push({ role: 'user', content: hint });
      render();

      try {
        const { guess, isCorrect, responseV1, responseV2 } = await getAIResponse(hint);

        // 1. AIの推測（肯定）
        state.currentAiBubble = responseV1;
        render();

        // 1秒後に履歴に追加
        setTimeout(async () => {
          state.conversationHistory.push({ role: 'ai', content: responseV1 });
          state.currentAiBubble = null; // 履歴表示に戻す（履歴には入っているので表示は変わらないはずだが、新規扱いになる）
          render();

          if (isCorrect || state.turnCount >= 10) {
            // ゲーム終了
            setTimeout(async () => {
              state.screen = 'loading';
              render();
              await Promise.all([analyzeStrategies(), generateScript()]);
              state.screen = 'result';
              render();
            }, 2000);
          } else {
            // 不正解 -> ユーザー否定 -> AI撤回

            // 2. ユーザーの否定（少し遅延して表示）
            setTimeout(() => {
              const denialMsg = `でも、オカンが言うには「${guess}」ではないらしいねん`;
              state.conversationHistory.push({ role: 'user', content: denialMsg });
              render();

              // 3. AIの撤回（さらに遅延して表示）
              setTimeout(() => {
                state.currentAiBubble = responseV2;
                render();

                // 1秒後に履歴に追加
                setTimeout(() => {
                  state.conversationHistory.push({ role: 'ai', content: responseV2 });
                  state.currentAiBubble = null;
                  state.isProcessing = false; // 入力ロック解除
                  render();
                }, 1000);

              }, 1500);
            }, 1500);
          }
        }, 1000); // responseV1表示の1秒後

      } catch (error) {
        console.error('Failed to get AI response:', error);
        state.isProcessing = false;
        render();
      }
    };

    submitBtn.addEventListener('click', handleSubmit);
    hintInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSubmit();
    });
  }

  // End game button
  const endGameBtn = document.getElementById('end-game-btn');
  if (endGameBtn) {
    endGameBtn.addEventListener('click', async () => {
      if (state.conversationHistory.length < 2) {
        alert('もう少しヒントを出してからゲームを終了してください！');
        return;
      }

      state.screen = 'loading';
      render();
      await Promise.all([analyzeStrategies(), generateScript()]);
      state.screen = 'result';
      render();
    });
  }

  // Print button
  const printBtn = document.getElementById('print-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Replay button
  const replayBtn = document.getElementById('replay-btn');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      state.screen = 'intro';
      state.difficulty = null;
      state.difficulty = null;
      state.topic = '';
      state.category = '';
      state.userName = '';
      state.conversationHistory = [];
      state.turnCount = 0;
      state.currentUserBubble = null;
      state.currentAiBubble = null;
      state.script = '';
      state.analysis = null;
      render();
    });
  }
}

// Initialize
render();
