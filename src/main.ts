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
  conversationHistory: ConversationItem[];
  turnCount: number;
  isProcessing: boolean;
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
  conversationHistory: [],
  turnCount: 0,
  isProcessing: false,
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
      turnCount: state.turnCount
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
      conversationHistory: state.conversationHistory
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
      conversationHistory: state.conversationHistory
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
          <div class="sanpachi-mic">
            <div class="mic-head"></div>
            <div class="mic-stand"></div>
          </div>
          
          <div class="conversation-area">
            <div class="bubble user">
              <span class="bubble-label">ボケ（あなた）</span>
              <div class="bubble-content">${lastUserMessage || `オカンが好きな${state.category || '〇〇'}があるらしいんやけど...`}</div>
            </div>
            <div class="bubble ai">
              <span class="bubble-label">ツッコミ（AI）</span>
              <div class="bubble-content ${state.isProcessing ? 'typing' : ''}">${state.isProcessing ? '考え中' : (lastAIMessage || 'ほう、なんやて？')}</div>
            </div>
          </div>
          
          <div class="input-area">
            <input type="text" id="hint-input" placeholder="ヒントを入力..." ${state.isProcessing ? 'disabled' : ''}>
            <button id="submit-hint-btn" ${state.isProcessing ? 'disabled' : ''}>送信</button>
          </div>
        </div>
      </div>
      
      <div class="sidebar">
        <h3>会話履歴</h3>
        <div class="history-list">
          ${state.conversationHistory.map(item => `
            <div class="history-item ${item.role}">
              <div class="history-item-label">${item.role === 'user' ? 'あなた' : 'AI'}</div>
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
        <h2>📜 ミルクボーイ風漫才台本</h2>
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

// Event handlers
function attachEventListeners(): void {
  // Difficulty buttons
  document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const level = (btn as HTMLButtonElement).dataset.level as 'easy' | 'normal' | 'hard';
      state.difficulty = level;
      state.screen = 'loading';
      render();

      try {
        const data = await generateTopic(level);
        state.topic = data.topic;
        state.category = data.category;
        state.conversationHistory = [];
        state.turnCount = 0;
        state.screen = 'game';
        render();
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
        state.conversationHistory.push({ role: 'ai', content: responseV1 });
        render();

        if (isCorrect || state.turnCount >= 10) {
          // ゲーム終了（少し待ってから遷移）
          setTimeout(async () => {
            state.screen = 'loading';
            render();
            await Promise.all([analyzeStrategies(), generateScript()]);
            state.screen = 'result';
            render();
          }, 2000);
        } else {
          // 不正解の場合は会話を続ける（自動進行）

          // 2. ユーザーの否定（少し遅延して表示）
          setTimeout(() => {
            const denialMsg = `でも、オカンが言うには「${guess}」ではないらしいねん`;
            state.conversationHistory.push({ role: 'user', content: denialMsg });
            render();

            // 3. AIの撤回と次の促し（さらに遅延して表示）
            setTimeout(() => {
              state.conversationHistory.push({ role: 'ai', content: responseV2 });
              state.isProcessing = false; // 入力ロック解除
              render();
            }, 1500);
          }, 1500);
        }
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
      state.topic = '';
      state.category = '';
      state.conversationHistory = [];
      state.turnCount = 0;
      state.script = '';
      state.analysis = null;
      render();
    });
  }
}

// Initialize
render();
