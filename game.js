// ============================================================
// SOUND ENGINE (Web Audio API)
// ============================================================
const SFX = {
  ctx: null,
  enabled: true,

  _init() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        this.enabled = false;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  play(type) {
    if (!this.enabled) return;
    this._init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    if (type === 'correct') {
      [880, 1100].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.connect(g); g.connect(ctx.destination);
        o.frequency.setValueAtTime(freq, now + i * 0.05);
        g.gain.setValueAtTime(0, now + i * 0.05);
        g.gain.linearRampToValueAtTime(0.18, now + i * 0.05 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.18);
        o.start(now + i * 0.05);
        o.stop(now + i * 0.05 + 0.2);
      });

    } else if (type === 'miss') {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(220, now);
      o.frequency.exponentialRampToValueAtTime(110, now + 0.1);
      g.gain.setValueAtTime(0.12, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      o.start(now);
      o.stop(now + 0.15);

    } else if (type === 'end') {
      [523, 415, 330, 262].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.connect(g); g.connect(ctx.destination);
        const t = now + i * 0.16;
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.22, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        o.start(t);
        o.stop(t + 0.25);
      });

    } else if (type === 'combo') {
      [660, 880, 1100].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.connect(g); g.connect(ctx.destination);
        const t = now + i * 0.07;
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        o.start(t);
        o.stop(t + 0.18);
      });
    }
  }
};

function toggleSound() {
  SFX.enabled = !SFX.enabled;
  document.getElementById('sound-toggle').textContent = SFX.enabled ? '🔊' : '🔇';
}

// ============================================================
// CSV PARSER
// ============================================================
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = [];
    let cur = '', inQ = false;
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { fields.push(cur); cur = ''; }
      else { cur += c; }
    }
    fields.push(cur);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (fields[idx] || '').trim(); });
    rows.push(obj);
  }
  return rows;
}

function buildElementsFromCSV(rows) {
  return rows.map(r => ({
    no:     parseInt(r.no),
    sym:    r.sym,
    ja:     r.ja,
    en:     r.en,
    hira:   r.hira,
    romaji: r.romaji,
    alts:   r.alts ? r.alts.split('|').map(s => s.trim()).filter(Boolean) : [],
    trivia: r.trivia,
    diff:   parseInt(r.diff),
    score:  parseInt(r.score),
  }));
}

// ============================================================
// DATA
// ============================================================
// ============================================================
// INLINE ELEMENTS DATA (elements.csv をバンドル化 — ネットワーク不要)
// ============================================================
const ELEMENTS_DATA = [
  {"no": 1, "sym": "H", "ja": "水素", "en": "Hydrogen", "hira": "すいそ", "romaji": "suiso", "alts": [], "trivia": "宇宙で最も豊富な元素。太陽の主成分", "diff": 1, "score": 10},
  {"no": 2, "sym": "He", "ja": "ヘリウム", "en": "Helium", "hira": "へりうむ", "romaji": "heriumu", "alts": [], "trivia": "風船に使われる軽い気体。最初に宇宙で発見", "diff": 1, "score": 10},
  {"no": 3, "sym": "Li", "ja": "リチウム", "en": "Lithium", "hira": "りちうむ", "romaji": "richiumu", "alts": ["ritiumu"], "trivia": "充電池に使われる最も軽い金属", "diff": 1, "score": 10},
  {"no": 4, "sym": "Be", "ja": "ベリリウム", "en": "Beryllium", "hira": "べりりうむ", "romaji": "beririumu", "alts": [], "trivia": "エメラルドに含まれる。X線を通しやすい", "diff": 2, "score": 20},
  {"no": 5, "sym": "B", "ja": "ホウ素", "en": "Boron", "hira": "ほうそ", "romaji": "houso", "alts": [], "trivia": "ガラス強化・半導体材料として重要", "diff": 1, "score": 10},
  {"no": 6, "sym": "C", "ja": "炭素", "en": "Carbon", "hira": "たんそ", "romaji": "tanso", "alts": ["tannso"], "trivia": "ダイヤモンドも黒鉛もこの元素でできている", "diff": 1, "score": 10},
  {"no": 7, "sym": "N", "ja": "窒素", "en": "Nitrogen", "hira": "ちっそ", "romaji": "chisso", "alts": ["tisso"], "trivia": "空気の約78%を占める不活性な気体", "diff": 1, "score": 10},
  {"no": 8, "sym": "O", "ja": "酸素", "en": "Oxygen", "hira": "さんそ", "romaji": "sanso", "alts": ["sannso"], "trivia": "呼吸と燃焼に不可欠な気体。空気の21%", "diff": 1, "score": 10},
  {"no": 9, "sym": "F", "ja": "フッ素", "en": "Fluorine", "hira": "ふっそ", "romaji": "fusso", "alts": ["husso"], "trivia": "歯磨き粉に含まれ虫歯を防ぐ", "diff": 1, "score": 10},
  {"no": 10, "sym": "Ne", "ja": "ネオン", "en": "Neon", "hira": "ねおん", "romaji": "neon", "alts": ["neonn"], "trivia": "ネオンサインに使われる希ガス", "diff": 1, "score": 10},
  {"no": 11, "sym": "Na", "ja": "ナトリウム", "en": "Sodium", "hira": "なとりうむ", "romaji": "natoriumu", "alts": [], "trivia": "食塩の成分。炎色反応は鮮やかな黄色", "diff": 1, "score": 10},
  {"no": 12, "sym": "Mg", "ja": "マグネシウム", "en": "Magnesium", "hira": "まぐねしうむ", "romaji": "maguneshiumu", "alts": ["magunesiumu"], "trivia": "花火の白い炎の原料。人体に必須のミネラル", "diff": 1, "score": 15},
  {"no": 13, "sym": "Al", "ja": "アルミニウム", "en": "Aluminium", "hira": "あるみにうむ", "romaji": "aruminiumu", "alts": [], "trivia": "軽くて錆びにくい。地殻中で最多の金属元素", "diff": 1, "score": 15},
  {"no": 14, "sym": "Si", "ja": "ケイ素", "en": "Silicon", "hira": "けいそ", "romaji": "keiso", "alts": [], "trivia": "半導体の材料。シリコンバレーの名の由来", "diff": 1, "score": 10},
  {"no": 15, "sym": "P", "ja": "リン", "en": "Phosphorus", "hira": "りん", "romaji": "rin", "alts": ["rinn"], "trivia": "骨・歯・DNAの重要成分。マッチに使われる", "diff": 1, "score": 10},
  {"no": 16, "sym": "S", "ja": "硫黄", "en": "Sulfur", "hira": "いおう", "romaji": "iou", "alts": [], "trivia": "火山で産出する黄色い固体。温泉の香り成分", "diff": 1, "score": 10},
  {"no": 17, "sym": "Cl", "ja": "塩素", "en": "Chlorine", "hira": "えんそ", "romaji": "enso", "alts": ["ennso"], "trivia": "プールの消毒に使われる黄緑色の気体", "diff": 1, "score": 10},
  {"no": 18, "sym": "Ar", "ja": "アルゴン", "en": "Argon", "hira": "あるごん", "romaji": "arugon", "alts": ["arugonn"], "trivia": "白熱電球内に封入される。空気の1%", "diff": 1, "score": 10},
  {"no": 19, "sym": "K", "ja": "カリウム", "en": "Potassium", "hira": "かりうむ", "romaji": "kariumu", "alts": [], "trivia": "バナナに豊富。筋肉や神経に不可欠なミネラル", "diff": 1, "score": 10},
  {"no": 20, "sym": "Ca", "ja": "カルシウム", "en": "Calcium", "hira": "かるしうむ", "romaji": "karushiumu", "alts": ["karusiumu"], "trivia": "骨・歯の主成分。牛乳に豊富", "diff": 1, "score": 15},
  {"no": 21, "sym": "Sc", "ja": "スカンジウム", "en": "Scandium", "hira": "すかんじうむ", "romaji": "sukanjiumu", "alts": ["sukanziumu", "sukannjiumu", "sukannziumu"], "trivia": "自転車フレームなどスポーツ用品の軽合金材料", "diff": 2, "score": 20},
  {"no": 22, "sym": "Ti", "ja": "チタン", "en": "Titanium", "hira": "ちたん", "romaji": "chitan", "alts": ["titan", "titann", "chitann"], "trivia": "軽くて強い。インプラントや航空機に使われる", "diff": 1, "score": 15},
  {"no": 23, "sym": "V", "ja": "バナジウム", "en": "Vanadium", "hira": "ばなじうむ", "romaji": "banajiumu", "alts": ["banaziumu"], "trivia": "鉄鋼の強度向上に使われる遷移金属", "diff": 2, "score": 20},
  {"no": 24, "sym": "Cr", "ja": "クロム", "en": "Chromium", "hira": "くろむ", "romaji": "kuromu", "alts": [], "trivia": "ステンレス鋼の必須成分。クロームメッキの材料", "diff": 1, "score": 15},
  {"no": 25, "sym": "Mn", "ja": "マンガン", "en": "Manganese", "hira": "まんがん", "romaji": "mangan", "alts": ["mangann", "manngan", "manngann"], "trivia": "乾電池の電極材料。鉄鋼の強化剤", "diff": 1, "score": 15},
  {"no": 26, "sym": "Fe", "ja": "鉄", "en": "Iron", "hira": "てつ", "romaji": "tetsu", "alts": ["tetu"], "trivia": "地球の核の主成分。人類が最も多く使う金属", "diff": 1, "score": 10},
  {"no": 27, "sym": "Co", "ja": "コバルト", "en": "Cobalt", "hira": "こばると", "romaji": "kobaruto", "alts": [], "trivia": "青いコバルトブルー色の由来。磁石の材料", "diff": 1, "score": 15},
  {"no": 28, "sym": "Ni", "ja": "ニッケル", "en": "Nickel", "hira": "にっける", "romaji": "nikkeru", "alts": [], "trivia": "硬貨の材料。ニクロム線に使われる", "diff": 1, "score": 15},
  {"no": 29, "sym": "Cu", "ja": "銅", "en": "Copper", "hira": "どう", "romaji": "dou", "alts": [], "trivia": "電線に広く使われる。熱・電気の良導体", "diff": 1, "score": 10},
  {"no": 30, "sym": "Zn", "ja": "亜鉛", "en": "Zinc", "hira": "あえん", "romaji": "aen", "alts": ["aenn"], "trivia": "鉄の防錆めっきに使われる。亜鉛華軟膏", "diff": 1, "score": 10},
  {"no": 31, "sym": "Ga", "ja": "ガリウム", "en": "Gallium", "hira": "がりうむ", "romaji": "gariumu", "alts": [], "trivia": "手の平の熱(30℃)で溶ける低融点金属", "diff": 2, "score": 20},
  {"no": 32, "sym": "Ge", "ja": "ゲルマニウム", "en": "Germanium", "hira": "げるまにうむ", "romaji": "gerumaniumu", "alts": [], "trivia": "メンデレーエフが発見を予言した元素", "diff": 2, "score": 20},
  {"no": 33, "sym": "As", "ja": "ヒ素", "en": "Arsenic", "hira": "ひそ", "romaji": "hiso", "alts": [], "trivia": "有名な毒。半導体にも使われる準金属", "diff": 1, "score": 15},
  {"no": 34, "sym": "Se", "ja": "セレン", "en": "Selenium", "hira": "せれん", "romaji": "seren", "alts": ["serenn"], "trivia": "光で電気を通す光電効果がある。コピー機に利用", "diff": 2, "score": 20},
  {"no": 35, "sym": "Br", "ja": "臭素", "en": "Bromine", "hira": "しゅうそ", "romaji": "shuuso", "alts": ["syuuso"], "trivia": "常温で液体の唯一の非金属元素", "diff": 2, "score": 20},
  {"no": 36, "sym": "Kr", "ja": "クリプトン", "en": "Krypton", "hira": "くりぷとん", "romaji": "kuriputon", "alts": ["kuriputonn"], "trivia": "スーパーマンの故郷「クリプトン星」の名の由来", "diff": 2, "score": 20},
  {"no": 37, "sym": "Rb", "ja": "ルビジウム", "en": "Rubidium", "hira": "るびじうむ", "romaji": "rubijiumu", "alts": ["rubiziumu"], "trivia": "原子時計の材料。赤い炎色反応", "diff": 2, "score": 20},
  {"no": 38, "sym": "Sr", "ja": "ストロンチウム", "en": "Strontium", "hira": "すとろんちうむ", "romaji": "sutoronchiumu", "alts": ["sutorontiumu", "sutoronnchiumu", "sutoronntiumu"], "trivia": "花火の赤い炎の原料。炎色反応は深紅色", "diff": 2, "score": 25},
  {"no": 39, "sym": "Y", "ja": "イットリウム", "en": "Yttrium", "hira": "いっとりうむ", "romaji": "ittoriumu", "alts": [], "trivia": "LEDや蛍光灯の赤色蛍光体に使われる", "diff": 2, "score": 25},
  {"no": 40, "sym": "Zr", "ja": "ジルコニウム", "en": "Zirconium", "hira": "じるこにうむ", "romaji": "jirukoniumu", "alts": ["zirukoniumu"], "trivia": "原子炉の燃料被覆管に使われる耐熱金属", "diff": 2, "score": 25},
  {"no": 41, "sym": "Nb", "ja": "ニオブ", "en": "Niobium", "hira": "におぶ", "romaji": "niobu", "alts": [], "trivia": "超電導体として使われるレアメタル", "diff": 2, "score": 20},
  {"no": 42, "sym": "Mo", "ja": "モリブデン", "en": "Molybdenum", "hira": "もりぶでん", "romaji": "moribuden", "alts": ["moribudenn"], "trivia": "鋼鉄を硬くする添加剤。高温でも溶けにくい", "diff": 2, "score": 25},
  {"no": 43, "sym": "Tc", "ja": "テクネチウム", "en": "Technetium", "hira": "てくねちうむ", "romaji": "tekunechiumu", "alts": ["tekunetiumu"], "trivia": "人工的に初めて作られた元素。医療用放射性同位体", "diff": 3, "score": 35},
  {"no": 44, "sym": "Ru", "ja": "ルテニウム", "en": "Ruthenium", "hira": "るてにうむ", "romaji": "ruteniumu", "alts": [], "trivia": "万年筆のペン先や電極の材料", "diff": 2, "score": 25},
  {"no": 45, "sym": "Rh", "ja": "ロジウム", "en": "Rhodium", "hira": "ろじうむ", "romaji": "rojiumu", "alts": ["roziumu"], "trivia": "自動車触媒として使われる最高値の金属", "diff": 2, "score": 25},
  {"no": 46, "sym": "Pd", "ja": "パラジウム", "en": "Palladium", "hira": "ぱらじうむ", "romaji": "parajiumu", "alts": ["paraziumu"], "trivia": "体積の900倍の水素を吸収できる金属", "diff": 2, "score": 25},
  {"no": 47, "sym": "Ag", "ja": "銀", "en": "Silver", "hira": "ぎん", "romaji": "gin", "alts": ["ginn"], "trivia": "金属の中で電気・熱の伝導率が最も高い", "diff": 1, "score": 10},
  {"no": 48, "sym": "Cd", "ja": "カドミウム", "en": "Cadmium", "hira": "かどみうむ", "romaji": "kadomiumu", "alts": [], "trivia": "イタイイタイ病の原因物質。ニッカド電池の材料", "diff": 2, "score": 20},
  {"no": 49, "sym": "In", "ja": "インジウム", "en": "Indium", "hira": "いんじうむ", "romaji": "injiumu", "alts": ["inziumu"], "trivia": "スマートフォンのタッチパネル電極の材料", "diff": 2, "score": 20},
  {"no": 50, "sym": "Sn", "ja": "スズ", "en": "Tin", "hira": "すず", "romaji": "suzu", "alts": [], "trivia": "ハンダの主要成分。ブリキはスズめっきの鉄", "diff": 1, "score": 10},
  {"no": 51, "sym": "Sb", "ja": "アンチモン", "en": "Antimony", "hira": "あんちもん", "romaji": "anchimon", "alts": ["antimon", "annchimon", "antimonn", "annchimonn", "anntimonn"], "trivia": "古代エジプトのアイメイクに使用された", "diff": 2, "score": 20},
  {"no": 52, "sym": "Te", "ja": "テルル", "en": "Tellurium", "hira": "てるる", "romaji": "teruru", "alts": [], "trivia": "太陽に比べ地球では非常に希少な元素", "diff": 2, "score": 20},
  {"no": 53, "sym": "I", "ja": "ヨウ素", "en": "Iodine", "hira": "ようそ", "romaji": "youso", "alts": [], "trivia": "消毒薬・甲状腺ホルモンの材料。昆布に豊富", "diff": 1, "score": 15},
  {"no": 54, "sym": "Xe", "ja": "キセノン", "en": "Xenon", "hira": "きせのん", "romaji": "kisenon", "alts": ["kisenonn"], "trivia": "HIDヘッドライトに使われる希ガス", "diff": 2, "score": 20},
  {"no": 55, "sym": "Cs", "ja": "セシウム", "en": "Cesium", "hira": "せしうむ", "romaji": "seshiumu", "alts": ["sesiumu"], "trivia": "原子時計の基準に使われる。最も電気陰性度が低い", "diff": 2, "score": 20},
  {"no": 56, "sym": "Ba", "ja": "バリウム", "en": "Barium", "hira": "ばりうむ", "romaji": "bariumu", "alts": [], "trivia": "X線検査の造影剤として使われる", "diff": 2, "score": 20},
  {"no": 57, "sym": "La", "ja": "ランタン", "en": "Lanthanum", "hira": "らんたん", "romaji": "rantan", "alts": ["ranntann"], "trivia": "カメラレンズの材料。ランタノイドの先頭", "diff": 2, "score": 20},
  {"no": 58, "sym": "Ce", "ja": "セリウム", "en": "Cerium", "hira": "せりうむ", "romaji": "seriumu", "alts": [], "trivia": "最も豊富な希土類元素。自動車の触媒に使われる", "diff": 2, "score": 20},
  {"no": 59, "sym": "Pr", "ja": "プラセオジム", "en": "Praseodymium", "hira": "ぷらせおじむ", "romaji": "puraseojiumu", "alts": ["puraseoziumu"], "trivia": "強力な永久磁石ネオジム磁石の材料", "diff": 3, "score": 35},
  {"no": 60, "sym": "Nd", "ja": "ネオジム", "en": "Neodymium", "hira": "ねおじむ", "romaji": "neojimu", "alts": ["neozimu"], "trivia": "世界最強クラスの永久磁石の主成分", "diff": 2, "score": 25},
  {"no": 61, "sym": "Pm", "ja": "プロメチウム", "en": "Promethium", "hira": "ぷろめちうむ", "romaji": "puromechiumu", "alts": ["purometiumu"], "trivia": "自然界にほとんど存在しない放射性の希土類元素", "diff": 3, "score": 35},
  {"no": 62, "sym": "Sm", "ja": "サマリウム", "en": "Samarium", "hira": "さまりうむ", "romaji": "samariumu", "alts": [], "trivia": "コバルトとの合金で強力な永久磁石に", "diff": 2, "score": 25},
  {"no": 63, "sym": "Eu", "ja": "ユウロピウム", "en": "Europium", "hira": "ゆうろぴうむ", "romaji": "yuuropiumu", "alts": [], "trivia": "蛍光灯の赤い蛍光体。紙幣の偽造防止に使われる", "diff": 3, "score": 30},
  {"no": 64, "sym": "Gd", "ja": "ガドリニウム", "en": "Gadolinium", "hira": "がどりにうむ", "romaji": "gadoriniumu", "alts": [], "trivia": "MRIの造影剤に使われる希土類元素", "diff": 3, "score": 30},
  {"no": 65, "sym": "Tb", "ja": "テルビウム", "en": "Terbium", "hira": "てるびうむ", "romaji": "terubiumu", "alts": [], "trivia": "スマートフォンのスピーカー振動板の材料", "diff": 3, "score": 30},
  {"no": 66, "sym": "Dy", "ja": "ジスプロシウム", "en": "Dysprosium", "hira": "じすぷろしうむ", "romaji": "jisupuroshiumu", "alts": ["jisupurosiumu", "zisupuroshiumu", "zisupurosiumu"], "trivia": "ネオジム磁石の耐熱性を大幅に向上させる", "diff": 3, "score": 35},
  {"no": 67, "sym": "Ho", "ja": "ホルミウム", "en": "Holmium", "hira": "ほるみうむ", "romaji": "horumiumu", "alts": [], "trivia": "元素の中で最も強い磁気モーメントを持つ", "diff": 3, "score": 30},
  {"no": 68, "sym": "Er", "ja": "エルビウム", "en": "Erbium", "hira": "えるびうむ", "romaji": "erubiumu", "alts": [], "trivia": "光ファイバー通信の増幅器に使われる", "diff": 3, "score": 30},
  {"no": 69, "sym": "Tm", "ja": "ツリウム", "en": "Thulium", "hira": "つりうむ", "romaji": "tsuriumu", "alts": ["turiumu"], "trivia": "ポータブルX線装置の放射源として利用", "diff": 3, "score": 30},
  {"no": 70, "sym": "Yb", "ja": "イッテルビウム", "en": "Ytterbium", "hira": "いってるびうむ", "romaji": "itterubiumu", "alts": [], "trivia": "光格子時計に使われる超高精度の原子時計材料", "diff": 3, "score": 35},
  {"no": 71, "sym": "Lu", "ja": "ルテチウム", "en": "Lutetium", "hira": "るてちうむ", "romaji": "rutechiumu", "alts": ["rutetiumu"], "trivia": "ランタノイドの中で最も重い元素", "diff": 3, "score": 35},
  {"no": 72, "sym": "Hf", "ja": "ハフニウム", "en": "Hafnium", "hira": "はふにうむ", "romaji": "hafuniumu", "alts": ["hahuniumu"], "trivia": "原子炉の制御棒の材料。ジルコニウムと分離が難しい", "diff": 2, "score": 25},
  {"no": 73, "sym": "Ta", "ja": "タンタル", "en": "Tantalum", "hira": "たんたる", "romaji": "tantaru", "alts": ["tanntaru"], "trivia": "スマートフォンのコンデンサーに不可欠なレアメタル", "diff": 2, "score": 25},
  {"no": 74, "sym": "W", "ja": "タングステン", "en": "Tungsten", "hira": "たんぐすてん", "romaji": "tangusuten", "alts": ["tanngusutenn", "tangusutenn", "tanngusuten"], "trivia": "全金属元素の中で最も高い融点(3422℃)を持つ", "diff": 2, "score": 25},
  {"no": 75, "sym": "Re", "ja": "レニウム", "en": "Rhenium", "hira": "れにうむ", "romaji": "reniumu", "alts": [], "trivia": "最後に発見された安定元素の一つ(1925年発見)", "diff": 2, "score": 25},
  {"no": 76, "sym": "Os", "ja": "オスミウム", "en": "Osmium", "hira": "おすみうむ", "romaji": "osumiumu", "alts": [], "trivia": "全元素の中で最も高い密度(22.59 g/cm³)を持つ", "diff": 2, "score": 25},
  {"no": 77, "sym": "Ir", "ja": "イリジウム", "en": "Iridium", "hira": "いりじうむ", "romaji": "irijiumu", "alts": ["iriziumu"], "trivia": "6600万年前の地層(K-Pg境界)に多く含まれる", "diff": 2, "score": 25},
  {"no": 78, "sym": "Pt", "ja": "白金", "en": "Platinum", "hira": "はっきん", "romaji": "hakkin", "alts": ["hakkinn"], "trivia": "触媒・宝飾品に使われる貴金属。プラチナとも呼ぶ", "diff": 2, "score": 20},
  {"no": 79, "sym": "Au", "ja": "金", "en": "Gold", "hira": "きん", "romaji": "kin", "alts": ["kinn"], "trivia": "腐食せず輝き続ける貴金属の代表", "diff": 1, "score": 10},
  {"no": 80, "sym": "Hg", "ja": "水銀", "en": "Mercury", "hira": "すいぎん", "romaji": "suigin", "alts": ["suiginn"], "trivia": "常温で液体の唯一の金属元素", "diff": 1, "score": 15},
  {"no": 81, "sym": "Tl", "ja": "タリウム", "en": "Thallium", "hira": "たりうむ", "romaji": "tariumu", "alts": [], "trivia": "強い毒性を持つ金属。ミステリー小説でお馴染み", "diff": 2, "score": 20},
  {"no": 82, "sym": "Pb", "ja": "鉛", "en": "Lead", "hira": "なまり", "romaji": "namari", "alts": [], "trivia": "重くて軟らかい。活版印刷の活字に使われた", "diff": 1, "score": 15},
  {"no": 83, "sym": "Bi", "ja": "ビスマス", "en": "Bismuth", "hira": "びすます", "romaji": "bisumasu", "alts": [], "trivia": "美しい虹色の階段状結晶を作る金属", "diff": 2, "score": 20},
  {"no": 84, "sym": "Po", "ja": "ポロニウム", "en": "Polonium", "hira": "ぽろにうむ", "romaji": "poroniumu", "alts": [], "trivia": "キュリー夫人が故国ポーランドにちなんで命名", "diff": 2, "score": 25},
  {"no": 85, "sym": "At", "ja": "アスタチン", "en": "Astatine", "hira": "あすたちん", "romaji": "asutachin", "alts": ["asutatin", "asutachinn", "asutatinn"], "trivia": "自然界に極めて微量しか存在しない準金属", "diff": 3, "score": 30},
  {"no": 86, "sym": "Rn", "ja": "ラドン", "en": "Radon", "hira": "らどん", "romaji": "radon", "alts": ["radonn"], "trivia": "放射性の希ガス。地下や建物に溜まることがある", "diff": 2, "score": 20},
  {"no": 87, "sym": "Fr", "ja": "フランシウム", "en": "Francium", "hira": "ふらんしうむ", "romaji": "furanshiumu", "alts": ["furansiumu", "huranshiumu", "huransiumu", "furannshiumu", "furannsiumu", "hurannshiumu", "hurannsiumu"], "trivia": "自然界に存在する最も不安定な元素", "diff": 3, "score": 35},
  {"no": 88, "sym": "Ra", "ja": "ラジウム", "en": "Radium", "hira": "らじうむ", "romaji": "rajiumu", "alts": ["raziumu"], "trivia": "キュリー夫人が発見した放射性元素。暗闇で光る", "diff": 2, "score": 25},
  {"no": 89, "sym": "Ac", "ja": "アクチニウム", "en": "Actinium", "hira": "あくちにうむ", "romaji": "akuchiniumu", "alts": ["akutiniumu"], "trivia": "暗闇で青白く光る強放射性元素", "diff": 3, "score": 30},
  {"no": 90, "sym": "Th", "ja": "トリウム", "en": "Thorium", "hira": "とりうむ", "romaji": "toriumu", "alts": [], "trivia": "次世代原子炉の燃料候補として注目される", "diff": 2, "score": 25},
  {"no": 91, "sym": "Pa", "ja": "プロトアクチニウム", "en": "Protactinium", "hira": "ぷろとあくちにうむ", "romaji": "purotoakuchiniumu", "alts": ["purotoakutiniumu"], "trivia": "非常に強い放射性を持つ希少元素", "diff": 3, "score": 40},
  {"no": 92, "sym": "U", "ja": "ウラン", "en": "Uranium", "hira": "うらん", "romaji": "uran", "alts": ["urann"], "trivia": "原子力発電の燃料。天然に存在する最重元素", "diff": 1, "score": 15},
  {"no": 93, "sym": "Np", "ja": "ネプツニウム", "en": "Neptunium", "hira": "ねぷつにうむ", "romaji": "neputsuniumu", "alts": ["neputuniumu"], "trivia": "人工合成された最初のトランスウラン元素", "diff": 3, "score": 35},
  {"no": 94, "sym": "Pu", "ja": "プルトニウム", "en": "Plutonium", "hira": "ぷるとにうむ", "romaji": "purutoniumu", "alts": [], "trivia": "核兵器・原子力発電の材料となる放射性元素", "diff": 2, "score": 30},
  {"no": 95, "sym": "Am", "ja": "アメリシウム", "en": "Americium", "hira": "あめりしうむ", "romaji": "amerishiumu", "alts": ["amerisiumu"], "trivia": "煙感知器に放射線源として使われている", "diff": 3, "score": 30},
  {"no": 96, "sym": "Cm", "ja": "キュリウム", "en": "Curium", "hira": "きゅりうむ", "romaji": "kyuriumu", "alts": [], "trivia": "キュリー夫妻にちなんで命名された超ウラン元素", "diff": 3, "score": 30},
  {"no": 97, "sym": "Bk", "ja": "バークリウム", "en": "Berkelium", "hira": "ばーくりうむ", "romaji": "ba-kuriumu", "alts": [], "trivia": "カリフォルニア州バークレーで発見", "diff": 3, "score": 35},
  {"no": 98, "sym": "Cf", "ja": "カリホルニウム", "en": "Californium", "hira": "かりほるにうむ", "romaji": "karihoruniumu", "alts": ["kariforuniumu"], "trivia": "強力な中性子源として金属探知などに使われる", "diff": 3, "score": 35},
  {"no": 99, "sym": "Es", "ja": "アインスタイニウム", "en": "Einsteinium", "hira": "あいんすたいにうむ", "romaji": "ainsutainiumu", "alts": [], "trivia": "アインシュタインにちなんで命名。水爆実験で発見", "diff": 3, "score": 40},
  {"no": 100, "sym": "Fm", "ja": "フェルミウム", "en": "Fermium", "hira": "ふぇるみうむ", "romaji": "fuerumiumu", "alts": ["ferumiumu"], "trivia": "核物理学者フェルミにちなんで命名", "diff": 3, "score": 40},
  {"no": 101, "sym": "Md", "ja": "メンデレビウム", "en": "Mendelevium", "hira": "めんでれびうむ", "romaji": "menderebiumu", "alts": [], "trivia": "元素周期表を作ったメンデレーエフにちなんで命名", "diff": 3, "score": 40},
  {"no": 102, "sym": "No", "ja": "ノーベリウム", "en": "Nobelium", "hira": "のーべりうむ", "romaji": "no-beriumu", "alts": ["noberiumu"], "trivia": "ノーベルにちなんで命名された超ウラン元素", "diff": 3, "score": 40},
  {"no": 103, "sym": "Lr", "ja": "ローレンシウム", "en": "Lawrencium", "hira": "ろーれんしうむ", "romaji": "ro-renshiumu", "alts": ["ro-rensiumu"], "trivia": "サイクロトロンを発明したローレンスにちなんで命名", "diff": 3, "score": 40},
  {"no": 104, "sym": "Rf", "ja": "ラザホージウム", "en": "Rutherfordium", "hira": "らざほーじうむ", "romaji": "razaho-jiumu", "alts": ["razaho-ziumu"], "trivia": "ラザフォードにちなんで命名。寿命は数秒", "diff": 3, "score": 40},
  {"no": 105, "sym": "Db", "ja": "ドブニウム", "en": "Dubnium", "hira": "どぶにうむ", "romaji": "dobuniumu", "alts": [], "trivia": "ロシアのドゥブナ研究所で発見", "diff": 3, "score": 40},
  {"no": 106, "sym": "Sg", "ja": "シーボーギウム", "en": "Seaborgium", "hira": "しーぼーぎうむ", "romaji": "shi-bo-giumu", "alts": ["si-bo-giumu"], "trivia": "核化学者シーボーグにちなんで命名", "diff": 3, "score": 40},
  {"no": 107, "sym": "Bh", "ja": "ボーリウム", "en": "Bohrium", "hira": "ぼーりうむ", "romaji": "bo-riumu", "alts": [], "trivia": "物理学者ニールス・ボーアにちなんで命名", "diff": 3, "score": 40},
  {"no": 108, "sym": "Hs", "ja": "ハッシウム", "en": "Hassium", "hira": "はっしうむ", "romaji": "hasshiumu", "alts": ["hassiumu"], "trivia": "ドイツのヘッセン州（ラテン語名Hassia）で発見", "diff": 3, "score": 40},
  {"no": 109, "sym": "Mt", "ja": "マイトネリウム", "en": "Meitnerium", "hira": "まいとねりうむ", "romaji": "maitoneriumu", "alts": [], "trivia": "核分裂を発見したリーゼ・マイトナーにちなんで命名", "diff": 3, "score": 40},
  {"no": 110, "sym": "Ds", "ja": "ダームスタチウム", "en": "Darmstadtium", "hira": "だーむすたちうむ", "romaji": "da-musutachiumu", "alts": ["da-musutatiumu"], "trivia": "ドイツのダルムシュタットで発見", "diff": 3, "score": 40},
  {"no": 111, "sym": "Rg", "ja": "レントゲニウム", "en": "Roentgenium", "hira": "れんとげにうむ", "romaji": "rentogeniumu", "alts": ["renntogeniumu"], "trivia": "X線を発見したレントゲンにちなんで命名", "diff": 3, "score": 40},
  {"no": 112, "sym": "Cn", "ja": "コペルニシウム", "en": "Copernicium", "hira": "こぺるにしうむ", "romaji": "koperunishiumu", "alts": ["koperunisiumu"], "trivia": "天文学者コペルニクスにちなんで命名", "diff": 3, "score": 40},
  {"no": 113, "sym": "Nh", "ja": "ニホニウム", "en": "Nihonium", "hira": "にほにうむ", "romaji": "nihoniumu", "alts": [], "trivia": "日本の理化学研究所が発見した唯一の元素", "diff": 2, "score": 30},
  {"no": 114, "sym": "Fl", "ja": "フレロビウム", "en": "Flerovium", "hira": "ふれろびうむ", "romaji": "furerobiumu", "alts": ["hurerobiumu"], "trivia": "フレロフ核反応研究所にちなんで命名", "diff": 3, "score": 40},
  {"no": 115, "sym": "Mc", "ja": "モスコビウム", "en": "Moscovium", "hira": "もすこびうむ", "romaji": "mosukobiumu", "alts": [], "trivia": "ロシアのモスクワ州にちなんで命名", "diff": 3, "score": 40},
  {"no": 116, "sym": "Lv", "ja": "リバモリウム", "en": "Livermorium", "hira": "りばもりうむ", "romaji": "ribamoriumu", "alts": [], "trivia": "米国リバモア国立研究所にちなんで命名", "diff": 3, "score": 40},
  {"no": 117, "sym": "Ts", "ja": "テネシン", "en": "Tennessine", "hira": "てねしん", "romaji": "teneshin", "alts": ["tenesin", "teneshinn", "tenesinn"], "trivia": "米国テネシー州にちなんで命名。2010年初合成", "diff": 3, "score": 40},
  {"no": 118, "sym": "Og", "ja": "オガネソン", "en": "Oganesson", "hira": "おがねそん", "romaji": "oganeson", "alts": ["oganesonn"], "trivia": "現在知られている最も原子番号が大きい元素", "diff": 3, "score": 40},
];

let ELEMENTS = [];

const PT_GRID = [
  [1,1],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[2,18],
  [3,1],[4,2],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[5,13],[6,14],[7,15],[8,16],[9,17],[10,18],
  [11,1],[12,2],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[13,13],[14,14],[15,15],[16,16],[17,17],[18,18],
  [19,1],[20,2],[21,3],[22,4],[23,5],[24,6],[25,7],[26,8],[27,9],[28,10],[29,11],[30,12],[31,13],[32,14],[33,15],[34,16],[35,17],[36,18],
  [37,1],[38,2],[39,3],[40,4],[41,5],[42,6],[43,7],[44,8],[45,9],[46,10],[47,11],[48,12],[49,13],[50,14],[51,15],[52,16],[53,17],[54,18],
  [55,1],[56,2],[-1,3],[72,4],[73,5],[74,6],[75,7],[76,8],[77,9],[78,10],[79,11],[80,12],[81,13],[82,14],[83,15],[84,16],[85,17],[86,18],
  [87,1],[88,2],[-2,3],[104,4],[105,5],[106,6],[107,7],[108,8],[109,9],[110,10],[111,11],[112,12],[113,13],[114,14],[115,15],[116,16],[117,17],[118,18],
  [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],
  [0,0],[0,0],[57,3],[58,4],[59,5],[60,6],[61,7],[62,8],[63,9],[64,10],[65,11],[66,12],[67,13],[68,14],[69,15],[70,16],[71,17],[0,0],
  [0,0],[0,0],[89,3],[90,4],[91,5],[92,6],[93,7],[94,8],[95,9],[96,10],[97,11],[98,12],[99,13],[100,14],[101,15],[102,16],[103,17],[0,0],
];

// ============================================================
// PERSISTENCE: STREAK / MASTERY / FIRST VISIT
// ============================================================
var STREAK_KEY  = 'ptgame_streak';
var MASTERY_KEY = 'ptgame_mastery';
var VISITED_KEY = 'ptgame_visited';

function isFirstVisit() {
  return !localStorage.getItem(VISITED_KEY);
}
function markVisited() {
  try { localStorage.setItem(VISITED_KEY, '1'); } catch(e) {}
}

function getStreakData() {
  try { return JSON.parse(localStorage.getItem(STREAK_KEY) || '{"count":0,"lastDate":""}'); }
  catch(e) { return { count: 0, lastDate: '' }; }
}
function touchStreak() {
  var today = new Date().toLocaleDateString('ja-JP');
  var s = getStreakData();
  if (s.lastDate === today) return s.count; // already played today
  var yest = new Date(Date.now() - 86400000).toLocaleDateString('ja-JP');
  s.count = (s.lastDate === yest) ? s.count + 1 : 1;
  s.lastDate = today;
  try { localStorage.setItem(STREAK_KEY, JSON.stringify(s)); } catch(e) {}
  return s.count;
}

function getMastered() {
  try { return new Set(JSON.parse(localStorage.getItem(MASTERY_KEY) || '[]')); }
  catch(e) { return new Set(); }
}
function addMastered(no) {
  var m = getMastered();
  m.add(no);
  try { localStorage.setItem(MASTERY_KEY, JSON.stringify(Array.from(m))); } catch(e) {}
  return m.size;
}
function getMasteryPct() {
  if (!ELEMENTS.length) return 0;
  return Math.round(getMastered().size / ELEMENTS.length * 100);
}

// ---- Dynamic title screen state ----
function initTitleDynamic() {
  var titleScreen = document.getElementById('scr-title');
  if (!titleScreen) return;

  // Inject catchphrase once
  if (!titleScreen.querySelector('.title-catch')) {
    var meta = titleScreen.querySelector('.title-meta');
    var catchEl = document.createElement('div');
    catchEl.className = 'title-catch';
    catchEl.textContent = '118種の化学元素をタイピングで制覇しよう';
    if (meta) meta.insertAdjacentElement('afterend', catchEl);
  }

  // Mark "学習モード" button as primary CTA
  var btns = titleScreen.querySelectorAll('.tbtn');
  btns.forEach(function(b) {
    if (b.querySelector('.tbtn-label') && b.querySelector('.tbtn-label').textContent.indexOf('学習') !== -1) {
      b.classList.add('tbtn-cta');
    }
  });

  // Update streak / mastery badges in title-meta
  var s = getStreakData();
  var mPct = getMasteryPct();
  var masteredCount = getMastered().size;

  var streakSpan = document.getElementById('streak-meta');
  var masterySpan = document.getElementById('mastery-meta');

  if (!streakSpan) {
    var metaEl = titleScreen.querySelector('.title-meta');
    if (metaEl) {
      var sp1 = document.createElement('span');
      sp1.id = 'streak-meta';
      metaEl.appendChild(sp1);
      var sp2 = document.createElement('span');
      sp2.id = 'mastery-meta';
      metaEl.appendChild(sp2);
    }
  }

  var sm = document.getElementById('streak-meta');
  var mm = document.getElementById('mastery-meta');
  if (sm) {
    sm.textContent = s.count > 0
      ? '\uD83D\uDD25 ' + s.count + '\u65E5\u9023\u7D9A'
      : '\u4ECA\u65E5\u304B\u3089\u59CB\u3081\u3088\u3046\uFF01';
  }
  if (mm && ELEMENTS.length) {
    mm.textContent = '\u7FD2\u5F97\u7387 ' + mPct + '% (' + masteredCount + '/' + ELEMENTS.length + ')';
  }
}

// ============================================================
// DATA LOADING (インライン化済み — fetch 不要)
// ============================================================
function loadElements() {
  const bar = document.getElementById('loading-bar');
  const msg = document.getElementById('loading-msg');
  try {
    bar.style.width = '60%';
    msg.textContent = 'LOADING DATA...';
    ELEMENTS = ELEMENTS_DATA;
    if (ELEMENTS.length === 0) throw new Error('インラインデータが空です');
    bar.style.width = '100%';
    msg.textContent = 'OK -- ' + ELEMENTS.length + '元素読み込み完了';
    document.getElementById('el-count-badge').textContent = '全' + ELEMENTS.length + '元素収録';
    document.getElementById('scr-loading').style.display = 'none';
    // Check URL for deep-link (mode or battle room)
    const routed = handleInitialUrl();
    if (!routed) {
      showScreen('title');
      // Dynamic title: streak, mastery, catchphrase
      initTitleDynamic();
      // First-time visitor → show welcome overlay
      if (isFirstVisit()) {
        markVisited();
        setTimeout(showWelcomeOverlay, 500);
      }
    }
  } catch (err) {
    bar.style.background = 'var(--error)';
    bar.style.width = '100%';
    msg.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'loading-err';
    div.innerHTML =
      '<strong>&#x26A0; ロードエラー</strong><br><br>' +
      err.message;
    document.getElementById('scr-loading').appendChild(div);
    console.error('[元素タイピング] load error:', err);
  }
}

// ============================================================
// GAME CONFIG
// ============================================================
const DIFF_INFO = {
  1: { label: '初級',     desc: '有名な元素から出題。まずはここから！' },
  2: { label: '中級',     desc: '初級＋中程度の難度の元素から出題。' },
  3: { label: '上級',     desc: '全元素から出題。豆知識問題も多め。' },
  0: { label: 'ランダム', desc: '全元素からランダムで出題。難易度混在。' },
};
const MODE_INFO = {
  timeattack: { label: 'タイムアタック', time: 60 },
  endless:    { label: 'エンドレス',     lives: 5 },
  practice:   { label: '学習モード' },
};
const QTYPE_LABELS = { name: '名前', symbol: '記号', trivia: '豆知識' };
const QTYPE_MULT   = { name: 1,     symbol: 1.5,    trivia: 2 };

// ============================================================
// GAME STATE
// ============================================================
let G = {
  mode: 'timeattack',
  diff: 1,
  score: 0,
  combo: 0,
  maxCombo: 0,
  lives: 5,
  count: 0,
  totalMisses: 0,
  timeLeft: 60,
  timerID: null,
  running: false,
  pool: [],
  poolIdx: 0,
  curEl: null,
  curQType: 'name',
  // confirmed input so far for the current question
  typed: '',
  // remaining valid completions (each starts with G.typed)
  validTargets: [],
  missesOnEl: 0,
  elResults: {},
  practicing: false,
  // lock flag: prevent input between correctAnswer() and nextQuestion()
  locked: false,
  // Review mode: elements that had ≥2 misses this session
  reviewPool: [],
  // Tutorial: shown flag to prevent re-triggering
  tutorialShown: false,
};

// ============================================================
// INPUT NORMALIZER
// ============================================================
/**
 * Normalize a raw character from keyboard / IME.
 * - NFKC: converts full-width alphanumerics (ａ→a, Ａ→A, １→1 …)
 * - toLowerCase
 * - Returns a single ASCII letter or '' if not usable.
 */
function normalizeChar(raw) {
  if (!raw || raw.length === 0) return '';
  // 長音符（ー U+30FC）をハイフンとして扱う。
  // JISキーボードのひらがなモードで「ー」キーを押すとこの文字が来る。
  // また全角長音符（ｰ U+FF70）も同様に処理する。
  if (raw === 'ー' || raw === 'ｰ') return '-';
  // NFKC normalization handles full-width characters
  // (ａ→a, Ａ→A, １→1, 全角ハイフン－(U+FF0D)→'-' etc.)
  const normalized = raw.normalize('NFKC').toLowerCase();
  // Accept a-z (romaji) and '-' (long vowel separator used in some element names)
  if (/^[a-z-]$/.test(normalized)) return normalized;
  return '';
}

// ============================================================
// "N" STATE MACHINE
// ============================================================
/**
 * The "n" pending state sits between G.typed and validTargets.
 *
 * Rules:
 *   1. When the user types 'n' and G.typed+'n' is a valid prefix for
 *      at least one target, we do NOT commit it yet — we store it as
 *      pendingN = true and wait for the next character.
 *
 *   2. Next character is 'n' (i.e. "nn"):
 *        Commit 'n' first, then process the second 'n' normally.
 *        This handles both "nn" as a single ん-sound and cases like
 *        "manngan" where nn = ん+n.
 *
 *   3. Next character is a consonant that is NOT a vowel or 'y':
 *        'n' is valid as ん — commit it and process the consonant.
 *
 *   4. Next character is a vowel (a/i/u/e/o) or 'y':
 *        'n' alone cannot represent ん here.
 *        Only targets that began with 'nn' at this position survive.
 *        If none survive → wrongInput().
 *
 *   5. End of word while pendingN is true:
 *        The 'n' at end of word is always valid — commit it and check
 *        for completion.
 *
 * pendingNState object:
 *   active  : boolean
 *   snapshot: the validTargets list AT THE MOMENT 'n' was typed.
 *             Used to distinguish "nn" vs "n+consonant" paths.
 */
let pendingNState = {
  active: false,
  snapshot: [],   // validTargets just before 'n' was stored
};

function resetPendingN() {
  pendingNState.active = false;
  pendingNState.snapshot = [];
}

/**
 * Commit the pending 'n' — advance G.typed and narrow G.validTargets.
 * Returns false if no targets survive (should not happen if called correctly).
 */
function commitPendingN() {
  const newTyped = G.typed + 'n';
  const filtered = G.validTargets.filter(t => t.startsWith(newTyped));
  if (filtered.length === 0) return false;
  G.typed = newTyped;
  G.validTargets = filtered;
  resetPendingN();
  return true;
}

const VOWELS = new Set(['a', 'i', 'u', 'e', 'o']);

/**
 * Main input processor.
 * Called once per character (already normalized to lowercase ASCII a-z).
 */
function processChar(c) {
  if (!G.running || G.practicing || G.locked) return;

  if (pendingNState.active) {
    // ---- resolve pending 'n' ----

    if (c === 'n') {
      // User typed a second 'n'.
      // Commit the first 'n', then process the second 'n' from scratch.
      if (!commitPendingN()) { wrongInput(); return; }
      // Now process this second 'n' — recurse (not pending yet)
      processChar('n');
      return;
    }

    if (VOWELS.has(c) || c === 'y') {
      // 母音/y が来た場合、2通りの可能性がある：
      //
      // [A] n が音節の子音である場合（ni→に, na→な, nu→ぬ, ne→ね, no→の, nya→にゃ ...）
      //     → G.typed + 'n' + c が有効なプレフィックスとして存在する
      //
      // [B] n が「ん」を表す場合
      //     → G.typed + 'nn' が有効なプレフィックスとして存在する（nn のみ許可）
      //
      // [A] を優先チェックする。存在すれば n を確定して c を処理する。
      // [A] が存在せず [B] のみ存在 → 単独 n は誤り（wrongInput）。
      // どちらも存在しない → wrongInput。

      // [A] n が音節の子音かどうか確認（ni→に, na→な, nu→ぬ, nya→にゃ ...）
      const nSyllableTargets = G.validTargets.filter(t => t.startsWith(G.typed + 'n' + c));
      if (nSyllableTargets.length > 0) {
        // n は音節の子音 → 確定して c も続けて処理
        commitPendingN();
        processChar(c);
        return;
      }

      // [B] n が「ん」を表す場合 → nn のみ有効
      //     母音/y が来ても単独 n では進められない → wrongInput
      //     pendingN をリセットして「最初の n からやり直し」状態にする
      wrongInput();
      return;
    }

    // Consonant (not n, not vowel, not y) → 'n' is a valid ん
    if (!commitPendingN()) { wrongInput(); return; }
    // Fall through to process c normally below
  }

  // ---- normal character processing ----
  const newTyped = G.typed + c;
  const filtered = G.validTargets.filter(t => t.startsWith(newTyped));

  if (filtered.length === 0) {
    wrongInput();
    return;
  }

  // At least one target matches newTyped as a prefix.
  if (c === 'n') {
    // Check if any target is EXACTLY newTyped (end-of-word 'n').
    const exact = filtered.some(t => t === newTyped);
    if (exact) {
      // The word ends here with 'n' — commit directly.
      G.typed = newTyped;
      G.validTargets = filtered;
      correctAnswer();
      return;
    }
    // Not end-of-word: defer commitment.
    pendingNState.active = true;
    pendingNState.snapshot = [...G.validTargets];
    // Do NOT update G.typed or G.validTargets yet.
    // We keep G.validTargets as-is so the guide still shows the full remainder.
    updateRomajiGuide();
    return;
  }

  // Normal non-n character accepted.
  G.typed = newTyped;
  G.validTargets = filtered;
  updateRomajiGuide();

  // Check completion
  if (filtered.some(t => t === newTyped)) {
    correctAnswer();
  }
}

// ============================================================
// UTILITIES
// ============================================================
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildPool(diff) {
  if (diff === 0) return shuffle(ELEMENTS);
  if (diff === 1) return shuffle(ELEMENTS.filter(e => e.diff === 1));
  if (diff === 2) return shuffle(ELEMENTS.filter(e => e.diff <= 2));
  return shuffle(ELEMENTS);
}

function comboClass(c) {
  if (c >= 20) return 'c4';
  if (c >= 10) return 'c3';
  if (c >= 5)  return 'c2';
  if (c >= 3)  return 'c1';
  return 'c0';
}

function comboMult(c) {
  if (c >= 20) return 4;
  if (c >= 10) return 3;
  if (c >= 5)  return 2;
  if (c >= 3)  return 1.5;
  return 1;
}

function pickQType(diff, elDiff) {
  const weights = ({
    1: [.80, .15, .05],
    2: [.50, .35, .15],
    3: [.25, .40, .35],
    0: [.40, .35, .25],
  })[diff] || [.80, .15, .05];

  const adjName = Math.max(0, weights[0] + (elDiff === 3 ? .15 : 0) - (elDiff === 1 ? .1 : 0));
  const tot = adjName + weights[1] + weights[2];
  const r = Math.random() * tot;
  if (r < adjName) return 'name';
  if (r < adjName + weights[1]) return 'symbol';
  return 'trivia';
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('scr-' + id).classList.add('active');
  const homeBtn = document.getElementById('btn-home');
  homeBtn.style.display = (id === 'title' || id === 'loading' || id === 'game') ? 'none' : 'flex';

  // iPad/iOS Safari: typing-inp へのフォーカスは scr-game がアクティブな場合のみ許可する。
  // 非ゲーム画面では display:none の親配下になるため focus() が失敗する。
  if (id !== 'game') {
    const inp = document.getElementById('typing-inp');
    if (document.activeElement === inp) inp.blur();
  }
}

// ============================================================
// URL ROUTING — History API
// ============================================================
const BASE_URL = 'https://astro-root.com/typing/';
const MODE_PATHS = {
  timeattack: 'timeattack',
  endless:    'endless',
  practice:   'practice',
  battle:     'battle',
};

function setUrl(path, replace) {
  try {
    // ハッシュルーティングを使用: /typing/#practice, /typing/#battle?room=ABCDEF
    //
    // 【修正理由】パスベースURL（/typing/practice）に直接アクセスすると、
    // 静的ホスティングはそのパスのファイルを探して404を返す。
    // ハッシュURLなら、サーバーは常に /typing/index.html を配信し、
    // ハッシュ以降はクライアント側のみで処理される。
    // これにより /typing/#practice への直接アクセスが正常動作する。
    const url = BASE_URL + (path ? '#' + path : '');
    if (replace) {
      history.replaceState({ path }, '', url);
    } else {
      history.pushState({ path }, '', url);
    }
  } catch(e) { /* iframe などで history が使えない場合は無視 */ }
}

// ブラウザバック/フォワード対応
window.addEventListener('popstate', function(e) {
  // history.state.path が優先、なければ現在のハッシュを参照
  const path = (e.state && e.state.path) || location.hash.replace(/^#/, '') || '';
  handleUrlPath(path);
});

function handleUrlPath(path) {
  if (!path || path === '/') { showScreen('title'); return; }
  const clean = path.replace(/^\//, '').split('?')[0];
  const qs    = path.includes('?') ? path.split('?')[1] : '';
  const params = new URLSearchParams(qs);
  if (clean === 'battle') {
    openBattle();
    const roomCode = params.get('room');
    if (roomCode) {
      // URLにroomコードがあれば自動入力して参加
      const rci = document.getElementById('room-code-input');
      if (rci) {
        rci.value = roomCode.toUpperCase();
        setTimeout(function() { joinRoom(); }, 600);
      }
    }
  } else if (MODE_PATHS[clean]) {
    openMode(clean);
  } else {
    showScreen('title');
  }
}

// 初回ロード時にURLを解析して画面を復元
function handleInitialUrl() {
  try {
    // ① ハッシュルーティング（主要パス）
    //    例: /typing/#practice, /typing/#battle?room=ABCDEF
    //    静的ホスティングでは常に index.html が返るため直接アクセスも動作する。
    const hash = location.hash.replace(/^#/, '');
    if (hash) {
      handleUrlPath(hash);
      return true;
    }

    // ② レガシーパスベースURL後方互換（サーバーがリライトで index.html を返す環境）
    //    例: /typing/practice → rel='practice'
    //    今後は ① のハッシュURLを使うよう setUrl が書き換え済み。
    const url = new URL(window.location.href);
    const base = new URL(BASE_URL);
    let rel = url.pathname.replace(base.pathname, '').replace(/^\//, '');
    const qs = url.search.replace('?', '');
    const path = qs ? (rel + '?' + qs) : rel;
    if (path) {
      handleUrlPath(path);
      // 以降はハッシュURLへ正規化（ブックマーク更新）
      setUrl(path, true);
      return true;
    }
  } catch(e) {}
  return false;
}

function trigger(el, cls, dur) {
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), dur || 400);
}

// ============================================================
// NAVIGATION
// ============================================================
// goHome is defined in the battle section below
function openMode(mode) {
  G.mode = mode;
  document.getElementById('mode-title-txt').textContent = MODE_INFO[mode].label + ' -- 難易度選択';
  const descs = {
    timeattack: '60秒でできるだけ多くの元素を入力！',
    endless:    'ライフが尽きるまで続けるサバイバル！',
    practice:   '解説カード付き。じっくり覚えよう。',
  };
  document.getElementById('mode-subtitle-txt').textContent = descs[mode];
  document.querySelectorAll('.dbtn').forEach(b => b.classList.remove('sel'));
  G.diff = -1;
  document.getElementById('diff-info').textContent = '難易度を選択してください';
  setUrl(MODE_PATHS[mode] || '');
  showScreen('mode');
}

function selDiff(d) {
  G.diff = d;
  document.querySelectorAll('.dbtn').forEach(b => b.classList.remove('sel'));
  document.querySelector('.dbtn[data-d="' + d + '"]').classList.add('sel');
  const pool = buildPool(d);
  document.getElementById('diff-info').textContent =
    DIFF_INFO[d].label + ' -- ' + DIFF_INFO[d].desc + '（出題候補: ' + pool.length + '元素）';
}

function startGame() {
  if (G.diff === -1) { alert('難易度を選択してください'); return; }
  SFX._init();
  initGame();
  showScreen('game');
}

function restartGame() {
  openMode(G.mode);
  showScreen('mode');
}

// ============================================================
// GAME INIT
// ============================================================
function initGame() {
  clearInterval(G.timerID);
  // Clean up review banner from previous session
  var rb = document.getElementById('review-banner');
  if (rb) rb.remove();
  G.score = 0; G.combo = 0; G.maxCombo = 0;
  G.lives = G.mode === 'endless' ? 5 : 0;
  G.count = 0; G.totalMisses = 0;
  G.timeLeft = G.mode === 'timeattack' ? 60 : 0;
  G.pool = buildPool(G.diff);
  G.poolIdx = 0;
  G.elResults = {};
  G.running = true;
  G.practicing = false;
  G.locked = false;
  G.reviewPool = [];
  G.tutorialShown = false;
  updateHUD();
  document.getElementById('timer-wrap').style.display = G.mode === 'timeattack' ? '' : 'none';
  renderLives();
  if (G.mode === 'timeattack') G.timerID = setInterval(tickTimer, 1000);
  nextQuestion();
  setTimeout(() => document.getElementById('typing-inp').focus(), 100);
}

function tickTimer() {
  if (!G.running) return;
  G.timeLeft--;
  const tv = document.getElementById('h-timer');
  tv.textContent = G.timeLeft;
  tv.className = 'hud-val timer' +
    (G.timeLeft <= 10 ? ' danger' : G.timeLeft <= 20 ? ' warn' : '');
  if (G.timeLeft <= 0) endGame();
}

function nextQuestion() {
  G.locked = false;
  resetPendingN();

  if (G.poolIdx >= G.pool.length) { G.pool = shuffle(G.pool); G.poolIdx = 0; }
  const el = G.pool[G.poolIdx++];
  G.curEl = el;
  G.curQType = pickQType(G.diff, el.diff);
  G.validTargets = [el.romaji].concat(el.alts);
  G.typed = '';
  G.missesOnEl = 0;
  if (!G.elResults[el.no]) G.elResults[el.no] = { correct: false, misses: 0 };
  renderQuestion();
  updateRomajiGuide();
  // Tutorial: show hint on the very first question of a practice-mode game
  if (!G.tutorialShown && G.mode === 'practice' && G.count === 0 && G.poolIdx === 1) {
    G.tutorialShown = true;
    showTutorialHint();
  }
  document.getElementById('typing-inp').value = '';
  document.getElementById('typing-inp').focus();
}

function endGame() {
  G.running = false;
  clearInterval(G.timerID);
  SFX.play('end');
  // Record a play day for streak (not for battle mode)
  if (G.mode !== 'battle') touchStreak();
  showResult();
}

// ============================================================
// QUESTION RENDERING
// ============================================================
function renderQuestion() {
  const el = G.curEl, qt = G.curQType;
  const card = document.getElementById('el-card');
  card.className = 'el-card diff' + el.diff;
  document.getElementById('c-no').textContent = 'No.' + el.no + ' / ' + el.sym;
  const badge = document.getElementById('c-type-badge');
  badge.textContent = QTYPE_LABELS[qt];
  badge.className = 'card-type t-' + qt;
  const qc = document.getElementById('q-content');
  if (qt === 'name') {
    qc.innerHTML =
      '<div class="q-name">' + el.ja + '</div>' +
      '<div class="q-atno">' + el.en + '</div>';
  } else if (qt === 'symbol') {
    qc.innerHTML =
      '<div class="q-symbol">' + el.sym + '</div>' +
      '<div class="q-atno">&#x7B2C;' + el.no + '&#x756A;&#x5143;&#x7D20;</div>';
  } else {
    qc.innerHTML = '<div class="q-trivia">' + el.trivia + '</div>';
  }
  renderHints(0);
}

function renderHints(misses) {
  const el = G.curEl, qt = G.curQType;
  const diffs = ['', '初級', '中級', '上級'];
  const sm = Math.round(el.score * QTYPE_MULT[qt] * comboMult(G.combo));
  let html = '<span class="hint-pill shown">' + diffs[el.diff] + '</span>';
  html += '<span class="score-possible">+' + sm + 'pt</span>';

  if (qt === 'symbol') {
    if (misses >= 2) {
      html += '<span class="hint-pill shown">' + el.ja + '</span>';
    } else {
      html += '<span class="hint-pill' + (misses >= 1 ? ' shown' : '') + '">' +
        (misses >= 1 ? 'あと1ミスで日本語名' : '2ミスで日本語名') + '</span>';
    }
  } else if (qt === 'trivia') {
    if (misses >= 2) {
      html += '<span class="hint-pill shown">' + el.sym + ' / ' + el.ja + '</span>';
    } else if (misses >= 1) {
      html += '<span class="hint-pill shown">' + el.sym + '</span>';
    } else {
      html += '<span class="hint-pill">1ミスで元素記号</span>';
    }
  } else {
    if (misses >= 3) {
      html += '<span class="hint-pill shown">' + el.sym + '</span>';
    } else if (misses > 0) {
      html += '<span class="hint-pill shown">' + el.hira + '</span>';
    }
  }

  document.getElementById('hints').innerHTML = html;
}

// ============================================================
// ROMAJI GUIDE
// ============================================================
/**
 * Render the romaji progress bar.
 * When pendingN is active, show the 'n' as typed (dimmed) so the player
 * gets visual feedback, but we haven't committed it yet.
 */
function updateRomajiGuide() {
  const guide = G.validTargets[0] || '';

  // typed portion (committed)
  let displayTyped = G.typed;
  let remainder = guide.slice(G.typed.length);

  // If 'n' is pending, show it in the typed colour but the guide
  // advances one char to reflect the tentative 'n'.
  if (pendingNState.active) {
    displayTyped += 'n';
    remainder = guide.slice(G.typed.length + 1);
  }

  const cursor = remainder[0] || '';
  const rest   = remainder.slice(1);

  document.getElementById('romaji-guide').innerHTML =
    '<span class="rt">' + displayTyped + '</span>' +
    '<span class="rc">' + cursor + '</span>' +
    '<span class="rr">' + rest + '</span>';
  document.getElementById('romaji-guide').classList.remove('err');
  document.getElementById('inp-overlay').textContent =
    displayTyped + (cursor ? '_' : '');
}

// ============================================================
// CORRECT / WRONG
// ============================================================
function wrongInput() {
  G.totalMisses++;
  G.missesOnEl++;
  G.elResults[G.curEl.no].misses++;

  // Track elements that need review (2nd miss on element → flag for review)
  if (G.missesOnEl === 2 && G.curEl && G.reviewPool.indexOf(G.curEl.no) === -1) {
    G.reviewPool.push(G.curEl.no);
  }

  // Reset pendingN on wrong input — the 'n' is discarded
  resetPendingN();

  const card  = document.getElementById('el-card');
  const inp   = document.getElementById('typing-inp');
  const guideEl = document.getElementById('romaji-guide');
  trigger(card, 'shake', 300);
  inp.classList.add('err');
  guideEl.classList.add('err');
  setTimeout(() => { inp.classList.remove('err'); guideEl.classList.remove('err'); }, 250);

  renderHints(G.missesOnEl);

  if (G.mode === 'endless' && G.missesOnEl >= 7) {
    loseLife();
    skipElement(false);
  }
  SFX.play('miss');
}

function correctAnswer() {
  if (G.locked) return;
  G.locked = true;
  resetPendingN();

  const el = G.curEl;
  G.combo++;
  if (G.combo > G.maxCombo) G.maxCombo = G.combo;
  G.elResults[el.no].correct = true;
  const pts = Math.round(el.score * QTYPE_MULT[G.curQType] * comboMult(G.combo));
  G.score += pts;
  G.count++;
  // Perfect answer (no misses) → mark element as mastered
  if (G.missesOnEl === 0) addMastered(el.no);
  if (G.missesOnEl > 3) G.combo = 0;

  updateHUD();
  spawnScorePopup(pts);

  if (G.combo > 0 && G.combo % 5 === 0) {
    spawnComboBurst();
    SFX.play('combo');
  } else {
    SFX.play('correct');
  }

  trigger(document.getElementById('el-card'), 'flash', 400);

  if (G.mode === 'practice') {
    showPracticeCard(true);
  } else {
    setTimeout(nextQuestion, 120);
  }
}

function skipElement(userInitiated) {
  if (userInitiated === undefined) userInitiated = true;
  if (G.mode === 'endless' && userInitiated) loseLife();
  G.combo = 0;
  resetPendingN();
  updateHUD();
  if (G.mode === 'practice') {
    showPracticeCard(false);
  } else {
    nextQuestion();
  }
}

function loseLife() {
  G.lives = Math.max(0, G.lives - 1);
  renderLives();
  if (G.lives <= 0) endGame();
}

// ============================================================
// HUD
// ============================================================
function updateHUD() {
  document.getElementById('h-score').textContent = G.score.toLocaleString();
  const cv = document.getElementById('h-combo');
  cv.textContent = 'x' + (G.combo === 0 ? 1 : G.combo);
  cv.className = 'combo-val ' + comboClass(G.combo);
  trigger(cv, 'combo-bump', 150);
  document.getElementById('h-count').textContent = G.count;
  document.getElementById('prog').style.width = (G.poolIdx / G.pool.length * 100) + '%';
}

function renderLives() {
  const lv = document.getElementById('h-lives');
  if (G.mode !== 'endless') { lv.innerHTML = ''; return; }
  lv.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const sp = document.createElement('span');
    sp.className = 'life' + (i >= G.lives ? ' lost' : '');
    sp.textContent = '❤';
    lv.appendChild(sp);
  }
}

// ============================================================
// VISUAL EFFECTS
// ============================================================
function spawnScorePopup(pts) {
  const el = document.createElement('div');
  el.className = 'score-pop';
  el.textContent = '+' + pts;
  const r = document.getElementById('el-card').getBoundingClientRect();
  el.style.left = (r.left + r.width / 2 - 20) + 'px';
  el.style.top  = r.top + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function spawnComboBurst() {
  const el = document.createElement('div');
  el.className = 'combo-burst';
  const cls = comboClass(G.combo);
  const colors = { c4: 'var(--error)', c3: '#f97316', c2: 'var(--amber)', c1: 'var(--success)' };
  el.style.color = colors[cls] || 'var(--success)';
  el.textContent = G.combo + 'COMBO!';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

// ============================================================
// PRACTICE CARD
// ============================================================
function showPracticeCard(wasCorrect) {
  G.practicing = true;
  const el = G.curEl;
  const ov = document.createElement('div');
  ov.id = 'practice-ov';
  ov.className = 'practice-overlay';
  ov.innerHTML =
    '<div class="practice-card">' +
      '<div class="pc-status ' + (wasCorrect ? 'ok' : 'skip') + '">' +
        (wasCorrect ? '&#x2713; 正解！' : '→ スキップ') +
      '</div>' +
      '<div class="pc-atno">No.' + el.no + ' — ' + el.en + '</div>' +
      '<div class="pc-sym">' + el.sym + '</div>' +
      '<div class="pc-ja">' + el.ja + '</div>' +
      '<div class="pc-hira">' + el.hira + '</div>' +
      '<div class="pc-romaji">' + el.romaji +
        (el.alts.length ? ' / ' + el.alts.join(' / ') : '') +
      '</div>' +
      '<div class="pc-trivia">' + el.trivia + '</div>' +
      '<button class="pc-next" onclick="closePracticeCard()">次の問題へ →</button>' +
    '</div>';
  document.body.appendChild(ov);
}

function closePracticeCard() {
  const ov = document.getElementById('practice-ov');
  if (ov) ov.remove();
  G.practicing = false;
  nextQuestion();
  document.getElementById('typing-inp').focus();
}

// ============================================================
// RESULT
// ============================================================
function showResult() {
  // Remove any injected elements from a previous game session
  var oldExt = document.getElementById('r-stats-ext');
  if (oldExt) oldExt.remove();
  var oldReview = document.getElementById('review-notice');
  if (oldReview) oldReview.remove();

  showScreen('result');
  document.getElementById('r-title').textContent =
    G.mode === 'timeattack' ? 'TIME UP' :
    G.mode === 'endless'    ? 'GAME OVER' : 'RESULT';
  document.getElementById('r-mode').textContent =
    MODE_INFO[G.mode].label + ' / ' + DIFF_INFO[G.diff].label;
  animateCount('r-score', 0, G.score, 1200);
  document.getElementById('r-correct').textContent = G.count;
  document.getElementById('r-miss').textContent    = G.totalMisses;
  document.getElementById('r-combo').textContent   = G.maxCombo;
  buildPTGrid();

  const isNew = saveHighScore();
  const best  = getHighScore();
  const badge    = document.getElementById('r-hs-badge');
  const badgeVal = document.getElementById('r-hs-val');
  if (best > 0) {
    badge.style.display = '';
    if (isNew) {
      badgeVal.classList.add('new');
      badgeVal.textContent = '🎉 NEW RECORD！ ' + best.toLocaleString() + ' pt';
    } else {
      badgeVal.classList.remove('new');
      badgeVal.textContent = best.toLocaleString() + ' pt';
    }
  } else {
    badge.style.display = 'none';
  }

  // --- Extended stats: accuracy / mastery / streak ---
  var accuracy = (G.count + G.totalMisses) > 0
    ? Math.round(G.count / (G.count + G.totalMisses) * 100) : 0;
  var mPct  = getMasteryPct();
  var streak = getStreakData().count;

  var statsExt = document.createElement('div');
  statsExt.id = 'r-stats-ext';
  statsExt.className = 'result-stats-ext';
  statsExt.innerHTML =
    '<div class="stat-box-ext">' +
      '<span class="stat-lbl">ACCURACY</span>' +
      '<span class="stat-val acc-val">' + accuracy + '%</span>' +
    '</div>' +
    '<div class="stat-box-ext">' +
      '<span class="stat-lbl">MASTERY</span>' +
      '<span class="stat-val mast-val">' + mPct + '%</span>' +
    '</div>' +
    '<div class="stat-box-ext">' +
      '<span class="stat-lbl">STREAK</span>' +
      '<span class="stat-val str-val">' + streak + '\u65E5</span>' +
    '</div>';
  var statsRow = document.querySelector('.result-stats');
  if (statsRow) statsRow.insertAdjacentElement('afterend', statsExt);

  // --- Review notice: offer review mode if there are missed elements ---
  if (G.reviewPool.length > 0 && G.mode !== 'battle') {
    var notice = document.createElement('div');
    notice.id = 'review-notice';
    notice.className = 'review-notice';
    notice.innerHTML =
      '<span class="review-notice-icon">\uD83D\uDCDD</span>' +
      '<span class="review-notice-txt">\u82E6\u624B\u306A\u5143\u7D20\u304C <strong>' + G.reviewPool.length + '\u7A2E</strong> \u3042\u308A\u307E\u3059</span>' +
      '<button class="review-notice-btn" onclick="startReviewMode()">\u5FA9\u7FD2\u30E2\u30FC\u30C9\u3067\u518D\u6311\u6226</button>';
    var actions = document.querySelector('.result-actions');
    if (actions) actions.insertAdjacentElement('beforebegin', notice);
  }
}

function animateCount(id, from, to, dur) {
  const el = document.getElementById(id);
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / dur, 1);
    const e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    el.textContent = Math.round(from + (to - from) * e).toLocaleString();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function buildPTGrid() {
  const grid = document.getElementById('pt-grid');
  grid.innerHTML = '';
  const noMap = {};
  ELEMENTS.forEach(e => { noMap[e.no] = e; });
  PT_GRID.forEach(function(entry) {
    const no = entry[0];
    const cell = document.createElement('div');
    if (no === 0 || no === -1 || no === -2) {
      cell.className = 'pt-cell gap';
      if (no === -1) { cell.textContent = 'La'; cell.style.color = 'var(--text-dim)'; cell.style.fontSize = '7px'; }
      if (no === -2) { cell.textContent = 'Ac'; cell.style.color = 'var(--text-dim)'; cell.style.fontSize = '7px'; }
    } else {
      const r = G.elResults[no];
      const e = noMap[no];
      cell.textContent = e ? e.sym : '?';
      cell.className = !r ? 'pt-cell unseen' :
        (r.correct && r.misses === 0 ? 'pt-cell perfect' :
         r.correct                   ? 'pt-cell good' : 'pt-cell struggle');
      if (e) cell.title = e.ja + ' (' + e.sym + ')';
    }
    grid.appendChild(cell);
  });
}

// ============================================================
// HIGH SCORE
// ============================================================
function hsKey() { return 'hs_' + G.mode + '_' + G.diff; }

function getHighScore() {
  const saved = JSON.parse(localStorage.getItem(hsKey()) || '[]');
  return saved.length > 0 ? saved[0].score : 0;
}

function saveHighScore() {
  const key   = hsKey();
  const saved = JSON.parse(localStorage.getItem(key) || '[]');
  const prevBest = saved.length > 0 ? saved[0].score : 0;
  const isNew = G.score > prevBest;
  saved.push({
    score: G.score,
    correct: G.count,
    maxCombo: G.maxCombo,
    date: new Date().toLocaleDateString('ja-JP'),
  });
  saved.sort((a, b) => b.score - a.score);
  localStorage.setItem(key, JSON.stringify(saved.slice(0, 5)));
  return isNew;
}

function showHighScore() {
  const modeInfo = [
    { key: 'timeattack', label: 'タイムアタック' },
    { key: 'endless',    label: 'エンドレス' },
    { key: 'practice',   label: '学習モード' },
  ];
  const diffInfo = [
    { key: 1, label: '初級' },
    { key: 2, label: '中級' },
    { key: 3, label: '上級' },
    { key: 0, label: 'ランダム' },
  ];

  let rows = '';
  let hasAny = false;

  modeInfo.forEach(function(m) {
    let modeHasData = false;
    let modeRows = '';
    diffInfo.forEach(function(d) {
      const saved = JSON.parse(localStorage.getItem('hs_' + m.key + '_' + d.key) || '[]');
      if (saved.length > 0) {
        modeHasData = true;
        hasAny = true;
        modeRows +=
          '<tr><td>' + d.label + '</td>' +
          '<td>' + saved[0].date + '</td>' +
          '<td>正解 ' + saved[0].correct + '</td>' +
          '<td>' + saved[0].score.toLocaleString() + ' pt</td></tr>';
      }
    });
    if (modeHasData) {
      rows += '<tr class="hs-section"><td colspan="4">' + m.label + '</td></tr>';
      rows += modeRows;
    }
  });

  if (!rows) rows = '<tr><td colspan="4" style="color:var(--text-dim);text-align:center;padding:16px">データなし</td></tr>';

  const modal = document.createElement('div');
  modal.className = 'hs-modal';
  modal.innerHTML =
    '<div class="hs-inner">' +
      '<div class="hs-title">&#x1F3C6; HALL OF FAME</div>' +
      '<table class="hs-table">' +
        '<thead><tr><th>難易度</th><th>日付</th><th>正解数</th><th>スコア</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
      (hasAny
        ? '<button class="hs-reset-btn" onclick="clearHighScores(this.closest(\'.hs-modal\'))">記録をすべてリセット</button>'
        : '') +
      '<button class="hs-close" onclick="this.closest(\'.hs-modal\').remove()">閉じる</button>' +
    '</div>';
  document.body.appendChild(modal);
}

function clearHighScores(modal) {
  if (!confirm('すべての記録を削除しますか？')) return;
  ['timeattack', 'endless', 'practice'].forEach(function(m) {
    [1, 2, 3, 0].forEach(function(d) {
      localStorage.removeItem('hs_' + m + '_' + d);
    });
  });
  if (modal) modal.remove();
}

// ============================================================
// TWEET / X SHARE
// ============================================================
function tweetResult() {
  const diffName = DIFF_INFO[G.diff] ? DIFF_INFO[G.diff].label : '';
  const modeName = MODE_INFO[G.mode] ? MODE_INFO[G.mode].label : '';
  const text =
    '元素タイピングで ' + G.score.toLocaleString() + ' pt 獲得！🧪\n' +
    G.count + '元素正解 / ベストコンボ ' + G.maxCombo + 'x\n' +
    '（' + modeName + ' / ' + diffName + '）\n' +
    '#元素タイピング #化学 #PeriodicTyping';
  const url = 'https://astro-root.com/typing/';
  window.open(
    'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) +
    '&url=' + encodeURIComponent(url),
    '_blank',
    'noopener'
  );
}

// ============================================================
// IME GUARD
// ============================================================
// Japanese IME intercepts keystrokes before our handlers.
// We track composition state and ignore input events during composition.
let isComposing = false;
let _lastCompositionEnd = 0;
let _compositionStartTyped = ''; // composition開始時のG.typedを保存

// ---- keydown/input 二重処理防止フラグ ----
// デスクトップ・iPad Smart Keyboard では keydown と input の両方が発火する。
// keydown でキャラクタを処理した直後に input をスキップするためのフラグ。
// モバイル仮想キーボード（keydown が発火しないケース）では false のまま。
let _keydownHandled = false;

const _inp = document.getElementById('typing-inp');

_inp.addEventListener('compositionstart', function() {
  isComposing = true;
  _compositionStartTyped = G.typed;
  // フィールドをクリアしない。IMEは自分の候補文字をフィールドに書き込む。
  // クリアするとIMEが誤動作しcompositionendが空データで来るか発火しない場合がある。
});

_inp.addEventListener('compositionend', function(e) {
  isComposing = false;
  _lastCompositionEnd = Date.now();

  if (!G.running || G.practicing || G.locked) {
    this.value = G.typed;
    this.focus();
    return;
  }

  // --- 確定テキストの取得（3段階フォールバック） ---
  // 1. e.data が信頼できる場合（多くのモダンブラウザ）
  // 2. フィールド値からcomposition開始前のG.typedを除去した差分
  // 3. フィールド値全体（G.typedが空の場合）
  let composed = '';
  if (typeof e.data === 'string' && e.data.length > 0) {
    composed = e.data;
  } else {
    const fieldVal = this.value || '';
    if (_compositionStartTyped && fieldVal.startsWith(_compositionStartTyped)) {
      composed = fieldVal.slice(_compositionStartTyped.length);
    } else {
      composed = fieldVal.replace(_compositionStartTyped, '');
    }
  }

  // フィールドを確定済み入力に同期（IMEゴミを除去）
  this.value = G.typed;

  // --- NFKC正規化：全角英数→半角、長音符→ハイフン、ひらがな/漢字は破棄 ---
  // 例: 'ａｂ' → 'ab'、'ー' → '-'、'あ' → ''（破棄）
  const usable = composed
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u30FC\uFF70]/g, '-') // 長音符を統一
    .replace(/[^a-z\-]/g, '');       // a-z と - のみ残す

  for (let i = 0; i < usable.length; i++) {
    processChar(usable[i]);
  }

  this.value = G.typed;
  this.focus();
});

// ============================================================
// INPUT EVENTS
// ============================================================
document.addEventListener('keydown', function(e) {
  // Practice card: Enter / Arrow / Space → advance to next element
  if (G.practicing) {
    if (e.key === 'Enter' || e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      closePracticeCard();
    }
    return;
  }

  if (!G.running) return;
  if (e.isComposing || isComposing) return;

  // 'Dead' = アクセント等の合成キー, 無視する
  if (e.key === 'Dead' || e.key === 'Process') return;

  if (e.key === 'Tab') {
    e.preventDefault();
    skipElement(true);
    return;
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    endGame();
    return;
  }

  // Only handle single printable keys not modified by Ctrl/Meta/Alt
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const c = normalizeChar(e.key);
    if (c) {
      e.preventDefault();
      processChar(c);
      // iPad Smart Keyboard: input event が後から発火するのを防ぐため
      // フィールドを同期してから input イベントで差分が出ないようにする
      const inp = document.getElementById('typing-inp');
      inp.value = G.typed;
      // このキーストロークは keydown で処理済み → input イベントでの二重処理を防ぐ
      _keydownHandled = true;
    }
  }
});

/**
 * Fallback for virtual keyboards (mobile) that fire 'input' events.
 * Also handles full-width input via NFKC normalization.
 */
document.getElementById('typing-inp').addEventListener('input', function(e) {
  if (!G.running || G.practicing) return;

  // composition中はIMEがフィールドを管理しているので触らない。
  // compositionend が後で正しく処理する。
  if (e.isComposing || isComposing) return;

  // compositionend が直前に発火した場合は二重処理を防ぐ（余裕を持って100ms）
  if (Date.now() - _lastCompositionEnd < 100) {
    this.value = G.typed;
    return;
  }

  // keydown（デスクトップ / iPad Smart Keyboard）が既にこの文字を処理済みならスキップ。
  // _keydownHandled を false に戻してから return することで次の input は通常通り処理される。
  if (_keydownHandled) {
    _keydownHandled = false;
    this.value = G.typed;
    return;
  }

  // ---- モバイル仮想キーボードパス ----
  // keydown が発火しない（または Unidentified キーのみ）の場合にここで処理する。
  //
  // 【修正ポイント】base は常に G.typed のみ（pendingNState 補正を除去）。
  // 旧コードでは base = G.typed + (pendingNState.active ? 'n' : '') としていたため、
  // pending 'n' が存在するとき次の文字（例: 'i'）の input が届いた際、
  //   raw     = G.typed + 'i'  (例: 'arumii')
  //   base    = G.typed + 'n'  (例: 'arumin')
  //   両者の length が等しく raw.length > base.length が偽 → 文字が飲み込まれる不具合があった。
  // G.typed のみを基準にすることで pendingN 中の次文字も正しく processChar に渡る。
  const raw = e.target.value.normalize('NFKC').toLowerCase().replace(/[^a-z-]/g, '');
  if (raw.length > G.typed.length) {
    const newChars = raw.slice(G.typed.length);
    for (let i = 0; i < newChars.length; i++) {
      const c = normalizeChar(newChars[i]);
      if (c) processChar(c);
    }
  }
  // 常にフィールドを確定済み入力に同期（iOS Safariのカーソル問題対策）
  this.value = G.typed;
});

document.getElementById('typing-inp').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') e.preventDefault();
});
document.getElementById('scr-game').addEventListener('click', function() {
  if (G.running) document.getElementById('typing-inp').focus();
});

// iOS Safari: touchstart も必要（click だけでは発火しない場合がある）
document.getElementById('scr-game').addEventListener('touchstart', function() {
  if (G.running) document.getElementById('typing-inp').focus();
}, { passive: true });

// ============================================================
// ONLINE BATTLE — PeerJS P2P  (最大4人スター型)
// ============================================================
// トポロジー: ホストが中継ハブ
//   - ホスト: conns[] に最大3つのDataConnectionを保持
//   - ゲスト: conns[0] がホストへの接続のみ
//   - メッセージフロー:
//       guest → host : join / update / finish
//       host  → all  : welcome / start / broadcast / results

// ---- Seeded PRNG ----
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function seededShuffle(arr, seed) {
  const a = [...arr];
  const rand = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- Battle state ----
const MAX_PLAYERS = 4;

const BATTLE = {
  peer: null,
  conns: [],           // host: DataConnection[] to guests; guest: [conn to host]
  isHost: false,
  roomId: null,
  myId: 0,             // 0 = host, 1-3 = guest slot
  diff: 1,
  seed: 0,
  myNickname: 'Guest', // プレイヤーのニックネーム
  // players[i] = { id, score, combo, count, element, finished, name }
  players: [],
  myFinished: false,
  finishedCount: 0,
  countdownTimer: null,
  active: false,
  resultShown: false,
};

function battleMyPlayer() { return BATTLE.players[BATTLE.myId]; }

function initBattlePlayers(count) {
  BATTLE.players = [];
  for (let i = 0; i < count; i++) {
    BATTLE.players.push({
      id: i, score: 0, combo: 0, count: 0,
      element: '---', finished: false,
      name: i === 0 ? (BATTLE.myNickname || 'HOST') : 'P' + (i + 1),
    });
  }
}

// ---- UI helpers ----
function $b(id) { return document.getElementById(id); }

function setBattleStatus(msg, cls) {
  const el = $b('battle-status');
  if (!el) return;
  el.textContent = msg;
  el.className = 'battle-status ' + (cls || '');
}

function openBattle() {
  cleanupBattle();
  // ニックネームをlocalStorageから読み込む
  const savedNick = localStorage.getItem('ptgame_nickname') || '';
  BATTLE.myNickname = savedNick || 'Guest';
  const nickInput = $b('battle-nickname');
  if (nickInput) nickInput.value = savedNick;

  $b('battle-diff-row').querySelectorAll('.dbtn').forEach(b => b.classList.remove('sel'));
  BATTLE.diff = 1;
  $b('battle-diff-row').querySelector('[data-d="1"]').classList.add('sel');
  $b('room-code-display').style.display = 'none';
  const rci = $b('room-code-input');
  if (rci) {
    rci.value = '';
    // iPad/iOS Safari: autocapitalize="characters" がキーボード入力をブロックする場合があるため
    // none に上書きし、JS 側で toUpperCase() する
    rci.setAttribute('autocapitalize', 'none');
    rci.setAttribute('autocorrect', 'off');
    rci.setAttribute('spellcheck', 'false');
  }
  setBattleStatus('');
  $b('battle-join-btn').disabled = false;
  $b('battle-create-btn').disabled = false;
  $b('host-start-wrap').style.display = 'none';
  updateWaitingRoom([]);
  setUrl('battle');
  showScreen('battle');
}

function selBattleDiff(d) {
  BATTLE.diff = d;
  $b('battle-diff-row').querySelectorAll('.dbtn').forEach(b => b.classList.remove('sel'));
  $b('battle-diff-row').querySelector('[data-d="' + d + '"]').classList.add('sel');
}

// ---- Short code helpers ----
const PEER_PREFIX = 'PTGAME-';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateShortCode() {
  let s = '';
  for (let i = 0; i < 6; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}
function codeTopeerId(code) { return PEER_PREFIX + code.toUpperCase(); }

function shareRoomCode(code) {
  // ハッシュルーティングに対応したURLを生成（静的ホスティングで直接アクセス可能）
  const url = 'https://astro-root.com/typing/#battle?room=' + code;
  return '元素タイピング対戦に招待！\nルームコード: ' + code + '\n' + url + '\nURLを開けばコード入力不要で参加できるよ🧪';
}

// ============================================================
// SNSシェア関数（対戦ルーム）
// ============================================================
function shareRoomLine() {
  const codeEl = document.getElementById('room-code-value');
  const code = codeEl ? codeEl.textContent : '';
  const text = '元素タイピングで対戦しよう！ルームコード: ' + code + '\nhttps://astro-root.com/typing/';
  window.open('https://line.me/R/share?text=' + encodeURIComponent(text), '_blank', 'noopener');
}

function shareRoomX() {
  const codeEl = document.getElementById('room-code-value');
  const code = codeEl ? codeEl.textContent : '';
  const text = '元素タイピングで対戦しよう！ルームコード: ' + code + ' #元素タイピング';
  const url = 'https://astro-root.com/typing/';
  window.open(
    'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) +
    '&url=' + encodeURIComponent(url),
    '_blank', 'noopener'
  );
}

// ---- ICE config (STUN + TURN for NAT traversal) ----
// openrelay.metered.ca (OpenRelay) は2024年に廃止済み。旧認証情報は無効。
// Metered.ca の無料アカウントで API キーを取得すると TURN の信頼性が上がる。
// https://dashboard.metered.ca → TURN → API Key
const METERED_API_KEY = ''; // ← Metered.ca の API キーを入力（空欄=フォールバック使用）

// フォールバック ICE サーバーリスト
// STUN: 複数プロバイダ併用でNAT検出成功率を上げる
// TURN: freeturn.net（登録不要の無料公開サーバー）＋ metered.ca STUN
const ICE_SERVERS_FALLBACK = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.stunprotocol.org:3478' },
  { urls: 'stun:stun.relay.metered.ca:80' },
  // freeturn.net: 登録不要の無料 TURN サーバー（UDP/TLS両対応）
  { urls: 'turn:freeturn.net:3478',  username: 'free', credential: 'free' },
  { urls: 'turns:freeturn.net:5349', username: 'free', credential: 'free' },
  // numb.viagenie.ca: 別系統の無料 TURN（freeturn が落ちている場合のバックアップ）
  { urls: 'turn:numb.viagenie.ca',   username: 'webrtc@live.com', credential: 'muazkh' },
];

let _cachedIceServers = null;

// ICE サーバーリストを非同期取得（Metered.ca API キーがあれば動的取得、なければフォールバック）
async function getIceServers() {
  if (_cachedIceServers) return _cachedIceServers;
  if (METERED_API_KEY) {
    try {
      const res = await fetch(
        'https://global.metered.ca/api/v1/turn/credentials?apiKey=' + METERED_API_KEY,
        { signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) {
        _cachedIceServers = await res.json();
        return _cachedIceServers;
      }
    } catch (e) { /* API 失敗時はフォールバックへ */ }
  }
  _cachedIceServers = ICE_SERVERS_FALLBACK;
  return _cachedIceServers;
}

// ---- PeerJS lazy load (Promise版) ----
function loadPeerJS() {
  return new Promise(function(resolve, reject) {
    if (typeof Peer !== 'undefined') { resolve(); return; }
    const s = document.createElement('script');
    // 1.5.4: 1.5.2 の DataChannel 安定性バグを修正したバージョン
    s.src = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
    s.onload = resolve;
    s.onerror = function() { reject(new Error('PeerJS の読み込みに失敗しました。ネット接続を確認してください。')); };
    document.head.appendChild(s);
  });
}

// 後方互換: コールバック形式も維持
function getPeerJS(cb) { loadPeerJS().then(cb).catch(function(e) { setBattleStatus(e.message, 'err'); }); }

// ---- Waiting room UI ----
function updateWaitingRoom(players) {
  const el = $b('waiting-players');
  if (!el) return;
  if (players.length === 0) {
    el.innerHTML = '<div class="wp-empty">参加者がいません</div>';
    return;
  }
  el.innerHTML = players.map(function(p, i) {
    const isHost = i === 0;
    const name = p.name || (isHost ? 'HOST' : ('P' + (i + 1)));
    return '<div class="wp-row">' +
      '<span class="wp-icon">' + (isHost ? '👑' : '👤') + '</span>' +
      '<span class="wp-name">' + name + (isHost ? ' <span class="wp-host-tag">HOST</span>' : '') + '</span>' +
      '<span class="wp-status ok">✓ 準備完了</span>' +
    '</div>';
  }).join('');
}

// ---- HOST: broadcast room state to all guests ----
function hostBroadcast(msg) {
  BATTLE.conns.forEach(function(c) {
    if (c && c.open) { try { c.send(msg); } catch(e) {} }
  });
}

// ---- HOST: send to specific guest ----
function hostSendTo(idx, msg) {
  const c = BATTLE.conns[idx - 1]; // idx 1-3 → conns[0-2]
  if (c && c.open) { try { c.send(msg); } catch(e) {} }
}

// ---- GUEST: send to host ----
function guestSend(msg) {
  const c = BATTLE.conns[0];
  if (c && c.open) { try { c.send(msg); } catch(e) {} }
}

// ---- ニックネーム保存 ----
function saveNickname() {
  const nickInput = $b('battle-nickname');
  if (!nickInput) return;
  const name = nickInput.value.trim().slice(0, 12) || 'Guest';
  BATTLE.myNickname = name;
  localStorage.setItem('ptgame_nickname', name);
  return name;
}

// ---- CREATE ROOM (Host) ----
async function createRoom() {
  if (ELEMENTS.length === 0) { setBattleStatus('元素データ未ロード', 'err'); return; }
  saveNickname();
  $b('battle-create-btn').disabled = true;
  $b('battle-join-btn').disabled = true;
  setBattleStatus('接続中...', '');
  let iceServers;
  try {
    const results = await Promise.all([getIceServers(), loadPeerJS()]);
    iceServers = results[0];
  } catch (e) {
    setBattleStatus(e.message, 'err');
    $b('battle-create-btn').disabled = false;
    $b('battle-join-btn').disabled = false;
    return;
  }
  const peerConfig = { iceServers: iceServers, iceTransportPolicy: 'all' };
  cleanupBattle(false);
  BATTLE.isHost = true;
  BATTLE.myId   = 0;
  BATTLE.conns  = [];
  BATTLE.seed   = Math.floor(Math.random() * 0x7fffffff);
  const shortCode = generateShortCode();
  BATTLE.roomId = shortCode;
  BATTLE.peer = new Peer(codeTopeerId(shortCode), { debug: 1, config: peerConfig });

  BATTLE.peer.on('open', function() {
    $b('room-code-display').style.display = '';
    $b('room-code-value').textContent = shortCode;
    updateShareButtons(shortCode);
    // Update browser URL to include room code
    setUrl('battle?room=' + shortCode);
    $b('host-start-wrap').style.display = '';
    $b('host-start-btn').disabled = true; // need ≥2 players
    $b('waiting-room').style.display = '';
    initBattlePlayers(1);
    updateWaitingRoom(BATTLE.players);
    setBattleStatus('参加者を待っています... (1/' + MAX_PLAYERS + ')', 'wait');
  });

  BATTLE.peer.on('connection', function(conn) {
    const guestSlot = BATTLE.conns.length + 1; // 1,2,3
    if (guestSlot >= MAX_PLAYERS || BATTLE.active) {
      conn.close();
      return;
    }
    BATTLE.conns.push(conn);
    setupHostConn(conn, guestSlot);
  });

  BATTLE.peer.on('error', function(err) {
    if (err.type === 'unavailable-id') {
      // ID衝突: 別のコードで再試行
      BATTLE.peer.destroy();
      BATTLE.peer = null;
      $b('battle-create-btn').disabled = false;
      setBattleStatus('コードが使用中です。もう一度「ルーム作成」を押してください。', 'err');
      return;
    }
    if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') {
      setBattleStatus('PeerJSサーバーへの接続に失敗しました。ネット接続を確認してください。', 'err');
    } else {
      setBattleStatus('エラー: ' + err.type, 'err');
    }
    $b('battle-create-btn').disabled = false;
    $b('battle-join-btn').disabled = false;
  });
}

function setupHostConn(conn, guestSlot) {
  conn.on('open', function() {
    // Extend players array
    while (BATTLE.players.length <= guestSlot) {
      BATTLE.players.push({ id: BATTLE.players.length, score:0, combo:0, count:0, element:'---', finished:false, name:'P'+(BATTLE.players.length+1) });
    }
    // Tell guest their slot + config + current player list
    conn.send({ type: 'welcome', playerId: guestSlot, seed: BATTLE.seed, diff: BATTLE.diff });
    const total = BATTLE.conns.length + 1;
    setBattleStatus('参加者を待っています... (' + total + '/' + MAX_PLAYERS + ')', 'wait');
    // Enable start when ≥2 players
    if (total >= 2) $b('host-start-btn').disabled = false;
    updateWaitingRoom(BATTLE.players);
    // Notify other guests about new player count + names
    hostBroadcast({ type: 'roomstate', count: total, players: BATTLE.players });
  });

  conn.on('data', function(data) {
    onHostReceive(data, guestSlot);
  });

  conn.on('close', function() {
    if (BATTLE.active) {
      // Mark as finished with current score
      if (BATTLE.players[guestSlot]) BATTLE.players[guestSlot].finished = true;
      checkAllFinished();
    } else {
      // Remove from waiting room
      BATTLE.conns = BATTLE.conns.filter(function(c) { return c !== conn; });
      BATTLE.players.splice(guestSlot, 1);
      // Re-index
      BATTLE.players.forEach(function(p, i) { p.id = i; });
      updateWaitingRoom(BATTLE.players);
      const total = BATTLE.conns.length + 1;
      setBattleStatus('参加者を待っています... (' + total + '/' + MAX_PLAYERS + ')', 'wait');
      if (total < 2) $b('host-start-btn').disabled = true;
    }
  });
}

function onHostReceive(data, fromSlot) {
  if (data.type === 'hello') {
    // ゲストからニックネームを受信
    const p = BATTLE.players[fromSlot];
    if (p && data.name) p.name = String(data.name).slice(0, 12) || ('P' + (fromSlot + 1));
    updateWaitingRoom(BATTLE.players);
    hostBroadcast({ type: 'roomstate', count: BATTLE.conns.length + 1, players: BATTLE.players });
  } else if (data.type === 'update') {
    const p = BATTLE.players[fromSlot];
    if (p) { p.score = data.score; p.combo = data.combo; p.count = data.count; p.element = data.element || '---'; }
    // Broadcast all states to all guests
    hostBroadcast({ type: 'broadcast', players: BATTLE.players });
  } else if (data.type === 'finish') {
    const p = BATTLE.players[fromSlot];
    if (p) { p.score = data.score; p.count = data.count; p.finished = true; }
    BATTLE.finishedCount++;
    checkAllFinished();
  }
}

// HOST: manually start game
function hostStartGame() {
  if (BATTLE.conns.length === 0) return;
  $b('host-start-btn').disabled = true;
  // Lock room — no new joins
  BATTLE.active = true;
  const playerCount = BATTLE.players.length; // 実際の参加人数（ゴーストプレイヤー防止）
  hostBroadcast({ type: 'start', playerCount: playerCount });
  startBattleCountdown(playerCount);
}

// ---- JOIN ROOM (Guest) ----
async function joinRoom() {
  const raw = ($b('room-code-input').value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (raw.length < 4) { setBattleStatus('ルームコードを入力してください', 'err'); return; }
  if (ELEMENTS.length === 0) { setBattleStatus('元素データ未ロード', 'err'); return; }
  saveNickname();
  $b('battle-create-btn').disabled = true;
  $b('battle-join-btn').disabled = true;
  setBattleStatus('接続中...', '');
  let iceServers;
  try {
    const results = await Promise.all([getIceServers(), loadPeerJS()]);
    iceServers = results[0];
  } catch (e) {
    setBattleStatus(e.message, 'err');
    $b('battle-create-btn').disabled = false;
    $b('battle-join-btn').disabled = false;
    return;
  }
  const peerConfig = { iceServers: iceServers, iceTransportPolicy: 'all' };
  cleanupBattle(false);
  BATTLE.isHost = false;
  BATTLE.conns  = [];
  BATTLE.peer = new Peer(undefined, { debug: 1, config: peerConfig });
  BATTLE.peer.on('open', function() {
    const conn = BATTLE.peer.connect(codeTopeerId(raw), { reliable: true });
    BATTLE.conns.push(conn);
    setupGuestConn(conn, raw);
  });
  BATTLE.peer.on('error', function(err) {
    setBattleStatus('接続失敗: ' + err.type + '　コードを確認してください', 'err');
    $b('battle-create-btn').disabled = false;
    $b('battle-join-btn').disabled = false;
    cleanupBattle(false);
  });
}

function setupGuestConn(conn, raw) {
  // ICE タイムアウト: 15秒で接続が開かなければ諦めてリセット
  const openTimeout = setTimeout(function() {
    if (!conn.open) {
      setBattleStatus(
        '接続タイムアウト。コードを確認するか再試行してください。' +
        '（NAT環境によっては接続できない場合があります）',
        'err'
      );
      $b('battle-create-btn').disabled = false;
      $b('battle-join-btn').disabled = false;
      cleanupBattle(false);
    }
  }, 15000);

  conn.on('open', function() {
    clearTimeout(openTimeout);
    setBattleStatus('ホストに接続しました。開始を待っています...', 'ok');
  });
  conn.on('data', function(data) {
    onGuestReceive(data);
  });
  conn.on('close', function() {
    clearTimeout(openTimeout);
    if (BATTLE.active) showBattleDisconnect();
    else {
      setBattleStatus('ホストとの接続が切れました。', 'err');
      $b('battle-create-btn').disabled = false;
      $b('battle-join-btn').disabled = false;
    }
  });
  conn.on('error', function(err) {
    clearTimeout(openTimeout);
    setBattleStatus('接続エラー: ' + err + '　コードを確認するか、もう一度お試しください。', 'err');
    $b('battle-create-btn').disabled = false;
    $b('battle-join-btn').disabled = false;
    cleanupBattle(false);
  });
}

function onGuestReceive(data) {
  if (data.type === 'welcome') {
    BATTLE.myId   = data.playerId;
    BATTLE.seed   = data.seed;
    BATTLE.diff   = data.diff;
    setBattleStatus('ルーム参加OK！ホストの開始を待っています... (P' + (data.playerId + 1) + ')', 'wait');
    // ホストにニックネームを送信
    guestSend({ type: 'hello', name: BATTLE.myNickname });
  } else if (data.type === 'roomstate') {
    // ホストから参加者リストを受信（名前付き）
    if (data.players) {
      // ゲスト側の自分の名前は変えない
      const myName = BATTLE.myNickname;
      BATTLE.players = data.players;
      const me = BATTLE.players[BATTLE.myId];
      if (me) me.name = myName;
    }
    setBattleStatus('参加者: ' + data.count + '人。ホストの開始を待っています...', 'wait');
  } else if (data.type === 'start') {
    startBattleCountdown(data.playerCount); // ホストから受け取った実人数を渡す
  } else if (data.type === 'broadcast') {
    if (data.players) {
      // Merge into local players array
      BATTLE.players = data.players;
      updateBattleOpponentHUD();
    }
  } else if (data.type === 'results') {
    BATTLE.players = data.players;
    showBattleResult();
  }
}

// ---- Share buttons ----
function updateShareButtons(code) {
  const msg = shareRoomCode(code);
  const lineBtn = $b('share-line');
  const xBtn    = $b('share-x');
  if (lineBtn) lineBtn.href = 'https://line.me/R/msg/text/?' + encodeURIComponent(msg);
  if (xBtn)    xBtn.href   = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(msg);
}

// ---- Countdown ----
function startBattleCountdown(playerCount) {
  BATTLE.active = true;
  BATTLE.myFinished = false;
  BATTLE.finishedCount = 0;
  BATTLE.resultShown = false;
  // ゲスト側: ホストから受け取った実際の人数でプレイヤー配列を初期化する。
  // MAX_PLAYERS(=4) を使うと未参加スロットがゴーストとして残り、
  // showWaitingForOthers() が 15 秒タイムアウトまで解消しないバグの原因になる。
  if (!BATTLE.isHost) initBattlePlayers(playerCount || MAX_PLAYERS);
  showScreen('battle');
  $b('battle-lobby').style.display = 'none';
  $b('battle-countdown').style.display = 'flex';
  let count = 3;
  $b('countdown-num').textContent = count;
  BATTLE.countdownTimer = setInterval(function() {
    count--;
    if (count > 0) {
      $b('countdown-num').textContent = count;
      SFX.play('miss');
    } else {
      clearInterval(BATTLE.countdownTimer);
      $b('countdown-num').textContent = 'GO!';
      setTimeout(startBattleGame, 600);
    }
  }, 1000);
}

// ---- Start Battle Game ----
function startBattleGame() {
  clearInterval(G.timerID);
  G.mode = 'battle';
  G.diff = BATTLE.diff;
  G.score = 0; G.combo = 0; G.maxCombo = 0;
  G.lives = 0; G.count = 0; G.totalMisses = 0;
  G.timeLeft = 60;
  G.pool = seededShuffle(buildPool(BATTLE.diff), BATTLE.seed);
  G.poolIdx = 0;
  G.elResults = {};
  G.running = true;
  G.practicing = false;
  G.locked = false;
  MODE_INFO['battle'] = { label: 'オンライン対戦' };
  DIFF_INFO[BATTLE.diff] = DIFF_INFO[BATTLE.diff] || DIFF_INFO[1];

  showScreen('game');
  $b('battle-opp-panel').style.display = 'flex';
  $b('timer-wrap').style.display = '';
  renderLives();
  renderBattleOppPanel();
  G.timerID = setInterval(battleTick, 1000);
  nextQuestion();
  setTimeout(() => $b('typing-inp').focus(), 100);
}

function battleTick() {
  if (!G.running) return;
  G.timeLeft--;
  const tv = $b('h-timer');
  tv.textContent = G.timeLeft;
  tv.className = 'hud-val timer' +
    (G.timeLeft <= 10 ? ' danger' : G.timeLeft <= 20 ? ' warn' : '');
  sendBattleUpdate();
  if (G.timeLeft <= 0) finishMyBattle();
}

function finishMyBattle() {
  if (BATTLE.myFinished) return;
  G.running = false;
  clearInterval(G.timerID);
  BATTLE.myFinished = true;
  // Update own slot
  const me = BATTLE.players[BATTLE.myId];
  if (me) { me.score = G.score; me.count = G.count; me.finished = true; }
  if (BATTLE.isHost) {
    BATTLE.finishedCount++;
    checkAllFinished();
  } else {
    guestSend({ type: 'finish', score: G.score, count: G.count });
  }
  SFX.play('end');
  // Show "waiting" overlay while others play
  if (!BATTLE.resultShown) showWaitingForOthers();
}

function showWaitingForOthers() {
  // If all already finished just show result
  const allDone = BATTLE.players.every(function(p) { return p.finished; });
  if (allDone) { showBattleResult(); return; }
  // Put a non-blocking message over the game area
  const el = document.createElement('div');
  el.id = 'battle-wait-msg';
  el.className = 'battle-wait-msg';
  el.innerHTML = '<div class="bwm-inner"><div class="bwm-title">⏳ TIME UP</div><div class="bwm-sub">他のプレイヤーの終了を待っています...</div></div>';
  document.body.appendChild(el);
  // Timeout fallback: 15 seconds
  setTimeout(function() {
    if (!BATTLE.resultShown) {
      BATTLE.players.forEach(function(p) { p.finished = true; });
      showBattleResult();
    }
  }, 15000);
}

function checkAllFinished() {
  if (!BATTLE.isHost) return;
  const allDone = BATTLE.players.every(function(p) { return p.finished; });
  if (allDone && !BATTLE.resultShown) {
    // Update host's own score
    const me = BATTLE.players[0];
    if (me) { me.score = G.score; me.count = G.count; }
    // Send results to all guests
    hostBroadcast({ type: 'results', players: BATTLE.players });
    showBattleResult();
  }
}

function sendBattleUpdate() {
  const me = BATTLE.players[BATTLE.myId];
  if (me) { me.score = G.score; me.combo = G.combo; me.count = G.count; me.element = G.curEl ? G.curEl.sym : '---'; }
  const msg = { type: 'update', score: G.score, combo: G.combo, count: G.count, element: G.curEl ? G.curEl.sym : '---' };
  if (BATTLE.isHost) {
    // Broadcast current state to all guests
    hostBroadcast({ type: 'broadcast', players: BATTLE.players });
  } else {
    guestSend(msg);
  }
}

// ---- Opponent HUD ----
function renderBattleOppPanel() {
  const panel = $b('battle-opp-panel');
  if (!panel) return;
  updateBattleOpponentHUD();
}

function updateBattleOpponentHUD() {
  const panel = $b('battle-opp-panel');
  if (!panel) return;
  const opponents = BATTLE.players.filter(function(p) { return p.id !== BATTLE.myId; });
  if (opponents.length === 0) { panel.innerHTML = ''; return; }
  panel.innerHTML =
    '<span class="opp-label">&#x2694; 相手</span>' +
    opponents.map(function(p) {
      const displayName = p.name || ('P' + (p.id + 1));
      return '<span class="opp-sep">|</span>' +
        '<span class="opp-pname">' + displayName + '</span>' +
        '<span class="opp-element">' + (p.element || '---') + '</span>' +
        '<span class="opp-score">' + (p.score || 0).toLocaleString() + '</span>' +
        '<span class="opp-combo">x' + (p.combo || 1) + '</span>' +
        '<span class="opp-count">' + (p.count || 0) + '</span>';
    }).join('');
}

// ---- Battle Result ----
function showBattleResult() {
  if (BATTLE.resultShown) return;
  BATTLE.resultShown = true;
  BATTLE.active = false;
  const waitMsg = $b('battle-wait-msg');
  if (waitMsg) waitMsg.remove();

  // Update own score in players list
  const me = BATTLE.players[BATTLE.myId];
  if (me) { me.score = G.score; me.count = G.count; me.maxCombo = G.maxCombo; }

  // Sort by score descending
  const ranked = BATTLE.players.slice().sort(function(a, b) { return (b.score || 0) - (a.score || 0); });
  const myRank = ranked.findIndex(function(p) { return p.id === BATTLE.myId; }) + 1;
  const iWon   = myRank === 1;
  const isDraw = ranked[0].score === ranked[1].score;

  const medals = ['🥇','🥈','🥉','4️⃣'];
  const verdicts = { 1: '🏆 1位！', 2: '🥈 2位', 3: '🥉 3位', 4: '4位' };

  const scoresHtml = ranked.map(function(p, i) {
    const isMe = p.id === BATTLE.myId;
    const displayName = isMe ? 'あなた' : (p.name || ('P' + (p.id + 1)));
    return '<div class="br-score-box' + (isMe ? ' mine' : '') + '">' +
      '<div class="br-rank">' + medals[i] + '</div>' +
      '<div class="br-slabel">' + displayName + '</div>' +
      '<div class="br-sval">' + (p.score || 0).toLocaleString() + '</div>' +
      '<div class="br-smeta">正解 ' + (p.count || 0) + '問' + (isMe ? ' / COMBO ' + G.maxCombo + 'x' : '') + '</div>' +
    '</div>';
  }).join('');

  const overlay = document.createElement('div');
  overlay.id = 'battle-result-overlay';
  overlay.className = 'battle-result-overlay';
  overlay.innerHTML =
    '<div class="br-inner">' +
      '<div class="br-verdict ' + (iWon && !isDraw ? 'win' : myRank > 2 ? 'lose' : 'draw') + '">' +
        (verdicts[myRank] || myRank + '位') +
      '</div>' +
      '<div class="br-scores br-scores-multi">' + scoresHtml + '</div>' +
      '<div class="br-actions">' +
        '<button class="rbtn" onclick="goHome()">タイトルへ</button>' +
        '<button class="rbtn primary" onclick="rematch()">リマッチ</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
  $b('battle-opp-panel').style.display = 'none';
  SFX.play(iWon && !isDraw ? 'combo' : 'end');
}

function rematch() {
  const overlay = $b('battle-result-overlay');
  if (overlay) overlay.remove();
  openBattle();
}

function showBattleDisconnect() {
  if (BATTLE.resultShown) return;
  BATTLE.active = false;
  G.running = false;
  clearInterval(G.timerID);
  const overlay = document.createElement('div');
  overlay.className = 'battle-result-overlay';
  overlay.innerHTML =
    '<div class="br-inner">' +
      '<div class="br-verdict lose">接続が切れました</div>' +
      '<div class="br-actions">' +
        '<button class="rbtn" onclick="goHome()">タイトルへ</button>' +
        '<button class="rbtn primary" onclick="this.closest(\'.battle-result-overlay\').remove(); openBattle()">再接続</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
  const oppPanel = $b('battle-opp-panel');
  if (oppPanel) oppPanel.style.display = 'none';
}

function cleanupBattle(fullClean) {
  if (fullClean !== false) {
    BATTLE.active = false;
    BATTLE.myFinished = false;
    BATTLE.finishedCount = 0;
    BATTLE.resultShown = false;
    BATTLE.players = [];
  }
  clearInterval(BATTLE.countdownTimer);
  BATTLE.conns.forEach(function(c) { try { c.close(); } catch(e) {} });
  BATTLE.conns = [];
  if (BATTLE.peer) { try { BATTLE.peer.destroy(); } catch(e) {} BATTLE.peer = null; }
  const lobby = $b('battle-lobby');
  const cd    = $b('battle-countdown');
  if (lobby) lobby.style.display = '';
  if (cd)    cd.style.display = 'none';
  const oppPanel = $b('battle-opp-panel');
  if (oppPanel) oppPanel.style.display = 'none';
  const waitMsg = $b('battle-wait-msg');
  if (waitMsg) waitMsg.remove();
  const ro = document.getElementById('battle-result-overlay');
  if (ro) ro.remove();
}

// Override goHome
function goHome() {
  cleanupBattle();
  G.running = false;
  clearInterval(G.timerID);
  // Remove review banner if present
  var rb = document.getElementById('review-banner');
  if (rb) rb.remove();
  setUrl('', true);
  showScreen('title');
  // Refresh streak / mastery displayed on title
  initTitleDynamic();
}

// ============================================================
// WELCOME OVERLAY (first visit)
// ============================================================
function showWelcomeOverlay() {
  var ov = document.createElement('div');
  ov.id = 'welcome-overlay';
  ov.className = 'welcome-overlay';
  ov.innerHTML =
    '<div class="welcome-card">' +
      '<div class="welcome-icon">\u2697\uFE0F</div>' +
      '<div class="welcome-title">\u5143\u7D20\u30BF\u30A4\u30D4\u30F3\u30B0\u3078\u3088\u3046\u3053\u305D\uFF01</div>' +
      '<div class="welcome-sub">' +
        '\u307E\u305A\u306F\u300C\u5B66\u7FD2\u30E2\u30FC\u30C9\u30FB\u521D\u7D1A\u300D\u3067\u30B9\u30BF\u30FC\u30C8\u3057\u3088\u3046\u3002<br>' +
        '\u89E3\u8AAC\u30AB\u30FC\u30C9\u4ED8\u304D\u3067\u3001\u5143\u7D20\u306E\u540D\u524D\u3068\u8AAD\u307F\u65B9\u3092\u697D\u3057\u304F\u899A\u3048\u3089\u308C\u307E\u3059\u3002' +
      '</div>' +
      '<button class="welcome-btn primary" onclick="dismissWelcome(true)">' +
        '\u25B6\uFE0F \u5B66\u7FD2\u30E2\u30FC\u30C9\u3092\u59CB\u3081\u308B\uFF08\u521D\u7D1A\uFF09' +
      '</button>' +
      '<button class="welcome-btn" onclick="dismissWelcome(false)">' +
        '\u81EA\u5206\u3067\u30E2\u30FC\u30C9\u3092\u9078\u3076' +
      '</button>' +
    '</div>';
  document.body.appendChild(ov);
}

function dismissWelcome(autoStart) {
  var ov = document.getElementById('welcome-overlay');
  if (ov) ov.remove();
  if (autoStart) {
    G.mode = 'practice';
    G.diff = 1;
    G.tutorialShown = false;
    SFX._init();
    initGame();
    showScreen('game');
  }
}

// ============================================================
// TUTORIAL HINT (first question of practice)
// ============================================================
function showTutorialHint() {
  // Pause game input during tutorial
  G.running = false;

  var ov = document.createElement('div');
  ov.id = 'tutorial-ov';
  ov.className = 'tutorial-overlay';
  ov.innerHTML =
    '<div class="tutorial-card">' +
      '<div class="tutorial-title">\uD83C\uDFAE \u904A\u3073\u65B9</div>' +
      '<div class="tutorial-step">' +
        '<span class="tut-num">1</span>' +
        '\u753B\u9762\u306B\u8868\u793A\u3055\u308C\u308B\u5143\u7D20\u540D\u3092\u65E5\u672C\u8A9E\u3067\u8AAD\u3080' +
      '</div>' +
      '<div class="tutorial-step">' +
        '<span class="tut-num">2</span>' +
        '\u30D8\u30DC\u30F3\u5F0F\u30ED\u30FC\u30DE\u5B57\u3067\u30BF\u30A4\u30D4\u30F3\u30B0\u3059\u308B' +
      '</div>' +
      '<div class="tutorial-step">' +
        '<span class="tut-num">3</span>' +
        '\u6B63\u89E3\u3059\u308B\u3068\u89E3\u8AAC\u30AB\u30FC\u30C9\u304C\u8868\u793A\u3055\u308C\u308B\uFF08Enter\u3067\u6B21\u3078\uFF09' +
      '</div>' +
      '<div class="tutorial-example">' +
        '\u4F8B\uFF1A\u300C\u6C34\u7D20\uFF08H\uFF09\u300D \u2192 <span class="tut-romaji">suiso</span>' +
      '</div>' +
      '<button class="tutorial-btn" onclick="closeTutorialHint()">' +
        '\u308F\u304B\u3063\u305F\uFF01\u59CB\u3081\u308B \u2192' +
      '</button>' +
    '</div>';
  document.body.appendChild(ov);
}

function closeTutorialHint() {
  var ov = document.getElementById('tutorial-ov');
  if (ov) ov.remove();
  G.running = true;
  document.getElementById('typing-inp').focus();
}

// ============================================================
// REVIEW MODE
// ============================================================
function startReviewMode() {
  if (!G.reviewPool.length) return;
  var reviewEls = ELEMENTS.filter(function(e) { return G.reviewPool.indexOf(e.no) !== -1; });
  if (!reviewEls.length) return;

  var savedPool = G.reviewPool.slice();
  clearInterval(G.timerID);
  G.mode = 'practice';
  G.score = 0; G.combo = 0; G.maxCombo = 0;
  G.lives = 0; G.count = 0; G.totalMisses = 0;
  G.timeLeft = 0;
  G.pool = savedPool.map(function(no) { return reviewEls.find(function(e) { return e.no === no; }); }).filter(Boolean);
  G.poolIdx = 0;
  G.elResults = {};
  G.running = true;
  G.practicing = false;
  G.locked = false;
  G.reviewPool = [];
  G.tutorialShown = true; // skip tutorial in review mode

  updateHUD();
  document.getElementById('timer-wrap').style.display = 'none';
  renderLives();
  showScreen('game');

  // Show review banner
  var existing = document.getElementById('review-banner');
  if (existing) existing.remove();
  var banner = document.createElement('div');
  banner.id = 'review-banner';
  banner.className = 'review-banner';
  banner.textContent = '\uD83D\uDCDD \u5FA9\u7FD2\u30E2\u30FC\u30C9\uFF1A\u82E6\u624B\u5143\u7D20 ' + G.pool.length + '\u554F';
  var scrGame = document.getElementById('scr-game');
  // Insert after HUD
  var hud = scrGame.querySelector('.hud');
  if (hud) hud.insertAdjacentElement('afterend', banner);
  else scrGame.insertBefore(banner, scrGame.firstChild);

  nextQuestion();
  setTimeout(function() { document.getElementById('typing-inp').focus(); }, 100);
}

// ============================================================
// BOOT
// ============================================================
loadElements();
