// 16 Translation Strategies Definition
export interface Strategy {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    example: string;
    color: 'blue' | 'red';
    icon: string;
}

export const strategies: Strategy[] = [
    // Blue cards (8)
    {
        id: 'amplification',
        name: '増幅',
        nameEn: 'Amplification',
        description: '元の意味をより強く、広く、目立たせるように言い換えよう。',
        example: '「寒い」→「凍えるほど寒い」',
        color: 'blue',
        icon: '⬤○○/⬤⬤⬤'
    },
    {
        id: 'diffusion',
        name: '拡散',
        nameEn: 'Diffusion',
        description: 'ある言葉や意味を、別のジャンルや文脈に広げてみよう。',
        example: '「エンパス」→「人生の指針」「チームの方向性」',
        color: 'blue',
        icon: '✱'
    },
    {
        id: 'divergence',
        name: '発散',
        nameEn: 'Divergence',
        description: 'ある言葉から連想できるものを、自由にたくさん出してみよう。',
        example: '「鯛」→「鯛/尾/笛/クラゲ/蛇/羽根」',
        color: 'blue',
        icon: '◆→→→'
    },
    {
        id: 'deletion',
        name: 'ゼロユニット化',
        nameEn: 'Deletion',
        description: 'あえて何かを削除して、抜けた意味から新たな物語を引き出そう。',
        example: '「父・母・兄・姉」→「母・姉」',
        color: 'blue',
        icon: '○—○/○—○'
    },
    {
        id: 'generalization',
        name: '一般化',
        nameEn: 'Generalization',
        description: '共通する部分を発見して、グループやカテゴリの名前に置き換えよう。',
        example: '「犬・猫」→「ペット」',
        color: 'blue',
        icon: '▲△△'
    },
    {
        id: 'abstraction',
        name: '抽象化',
        nameEn: 'Abstraction',
        description: '具体的な事例や物を、概念的な言葉に変えてみよう。',
        example: '「走る」→「身体を整える習慣」',
        color: 'blue',
        icon: '●—→'
    },
    {
        id: 'ethicalization',
        name: '倫理化',
        nameEn: 'Ethicalization',
        description: 'すでに倫理的に意味づけられた言葉に、あえて別の視点から新しい意味を与えてみよう。',
        example: '「ピンク」→「女の子はピンクでしょ」',
        color: 'blue',
        icon: '○△○'
    },
    {
        id: 'visualization',
        name: '視覚化',
        nameEn: 'Visualization',
        description: '言葉の内容を視覚的なイメージに変換してみよう。',
        example: '「時間」→「流れている川」の画像',
        color: 'blue',
        icon: '○—□'
    },
    // Red cards (8)
    {
        id: 'concretion',
        name: '具体化',
        nameEn: 'Concretion',
        description: '抽象的な言葉を、具体的な場面や行動で表してみよう。',
        example: '「努力」→「朝5時に起きて勉強」',
        color: 'red',
        icon: '▽→⬤'
    },
    {
        id: 'condensation',
        name: '凝縮',
        nameEn: 'Condensation',
        description: 'たくさんの意味や思いを、一言にギュッと詰め込んでみよう。',
        example: '「うまく言えないけど気になる」→「モヤる」',
        color: 'red',
        icon: '✱→●'
    },
    {
        id: 'reduction',
        name: '削減',
        nameEn: 'Reduction',
        description: '長い表現をそぎ落として、必要な要素だけにしてみよう。',
        example: '「いろいろあって疲れた」→「疲れた」',
        color: 'red',
        icon: '■■→■'
    },
    {
        id: 'convergence',
        name: '収束',
        nameEn: 'Convergence',
        description: 'バラバラな視点や要素を、共通するテーマにまとめてみよう。',
        example: '「魚・陸続き・海鮮丼」→「居酒屋」',
        color: 'red',
        icon: '◆◆→■'
    },
    {
        id: 'culturalTranslation',
        name: '文化的変換',
        nameEn: 'Cultural Translation',
        description: 'ある文化特有の言葉を、別の文化にも伝わる形に変えてみよう。',
        example: '「日本」「おせち料理」→「中国」「餃子」',
        color: 'red',
        icon: '○→○'
    },
    {
        id: 'substitution',
        name: '代用',
        nameEn: 'Substitution',
        description: 'ある言葉を、似た意味や役割の別の言葉に置き換えてみよう。',
        example: '「スマホ」→「ポケットの中のパソコン」',
        color: 'red',
        icon: '■■→■■'
    },
    {
        id: 'reordering',
        name: '順番変え',
        nameEn: 'Reordering',
        description: '決まった言葉の順番をあえて変えて、新たな視点や関係性を生み出してみよう。',
        example: '「男女」→「女男」',
        color: 'red',
        icon: '○□→□○'
    },
    {
        id: 'verbalization',
        name: '言語化',
        nameEn: 'Verbalization',
        description: '普段言葉にしていないことを、あえて言葉にしてみよう。',
        example: '「心ななめの気」→「愛おしさ」',
        color: 'red',
        icon: '?→○'
    }
];

export function getStrategyById(id: string): Strategy | undefined {
    return strategies.find(s => s.id === id);
}

export function getStrategyByName(name: string): Strategy | undefined {
    return strategies.find(s => s.name === name || s.nameEn.toLowerCase() === name.toLowerCase());
}
