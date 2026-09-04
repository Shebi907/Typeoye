// 500 most common English words for generating test text
export const COMMON_WORDS: string[] = [
  'the','be','to','of','and','a','in','that','have','it','for','not','on','with',
  'he','as','you','do','at','this','but','his','by','from','they','we','say','her',
  'she','or','an','will','my','one','all','would','there','their','what','so','up',
  'out','if','about','who','get','which','go','me','when','make','can','like','time',
  'no','just','him','know','take','people','into','year','your','good','some','could',
  'them','see','other','than','then','now','look','only','come','its','over','think',
  'also','back','after','use','two','how','our','work','first','well','way','even',
  'new','want','because','any','these','give','day','most','us','great','between',
  'need','large','often','hand','high','place','hold','turn','why','ask','went',
  'men','read','need','land','different','home','move','try','kind','hand','picture',
  'again','change','off','play','spell','air','away','animal','house','point','page',
  'letter','mother','answer','found','study','still','learn','should','america','world',
  'show','life','form','together','end','put','set','three','small','number','open',
  'seem','long','plant','cover','food','sun','four','between','state','keep','eye',
  'never','last','let','thought','city','tree','cross','farm','hard','start','might',
  'story','saw','far','sea','draw','left','late','run','while','press','close','night',
  'real','life','few','north','open','seem','together','next','white','children','begin',
  'got','walk','example','ease','paper','group','always','music','those','both','mark',
  'book','carry','took','science','eat','room','friend','began','idea','fish','mountain',
  'stop','once','base','hear','horse','cut','sure','watch','color','face','wood','main',
  'enough','plain','girl','usual','young','ready','above','ever','red','list','though',
  'feel','talk','bird','soon','body','dog','family','direct','pose','leave','song',
  'measure','door','product','black','short','numeral','class','wind','question','happen',
  'complete','ship','area','half','rock','order','fire','south','problem','piece','told',
  'knew','pass','since','top','whole','king','space','heard','best','hour','better',
  'true','during','hundred','five','remember','step','early','hold','west','ground',
  'interest','reach','fast','verb','sing','listen','six','table','travel','less','morning',
  'ten','simple','several','vowel','toward','war','lay','against','pattern','slow','center',
  'love','person','money','serve','appear','road','map','rain','rule','govern','pull',
  'cold','notice','voice','power','town','fine','drive','lead','cry','dark','machine',
  'note','wait','plan','figure','star','box','noun','field','rest','correct','able',
  'pound','done','beauty','drive','stood','contain','front','teach','week','final','gave',
  'green','oh','quick','develop','ocean','warm','free','minute','strong','special','mind',
  'behind','clear','tail','produce','fact','street','inch','multiply','nothing','course',
  'stay','wheel','full','force','blue','object','decide','surface','deep','moon','island',
  'foot','system','busy','test','record','boat','common','gold','possible','plane','instead',
  'dry','wonder','laugh','thousand','ago','ran','check','game','shape','miss','brought',
  'heat','snow','tire','bring','yes','distant','fill','east','paint','language','among',
];

export const SIMPLE_WORDS: string[] = [
  'the','be','to','of','and','a','in','that','have','it','for','not','on','with',
  'he','as','you','do','at','this','but','his','by','from','they','we','say','her',
  'she','or','an','will','my','one','all','would','there','their','what','so','up',
  'out','if','about','who','get','which','go','me','when','make','can','like','time',
  'no','just','him','know','take','people','into','year','your','good','some','could',
  'them','see','other','than','then','now','look','only','come','its','over','think',
  'also','back','after','use','two','how','our','work','first','well','way','even',
];

export const MEDIUM_WORDS: string[] = [
  'letter','mother','answer','found','study','still','learn','should','america','world',
  'show','life','form','together','end','put','set','three','small','number','open',
  'seem','long','plant','cover','food','sun','four','between','state','keep','eye',
  'never','last','let','thought','city','tree','cross','farm','hard','start','might',
  'story','saw','far','sea','draw','left','late','run','while','press','close','night',
  'real','life','few','north','open','seem','together','next','white','children','begin',
  'got','walk','example','ease','paper','group','always','music','those','both','mark',
  'book','carry','took','science','eat','room','friend','began','idea','fish','mountain',
  'stop','once','base','hear','horse','cut','sure','watch','color','face','wood','main',
  'enough','plain','girl','usual','young','ready','above','ever','red','list','though',
];

export const HARD_WORDS: string[] = [
  'complete','measure','product','numeral','question','happen','problem','piece',
  'remember','interest','pattern','several','toward','against','govern','notice',
  'machine','figure','correct','contain','develop','special','produce','multiply',
  'nothing','surface','possible','instead','thousand','distant','language','among',
  'experience','important','mountain','children','dictionary','technology','necessary',
  'environment','especially','particular','individual','difference','development',
  'performance','significant','management','understanding','international','knowledge',
];

/**
 * Generate a space-separated string of `count` random words.
 * Optionally interleave digits and punctuation.
 */
export function generateWordList(
  count: number,
  includeNumbers = false,
  includePunctuation = false,
  difficulty: 'simple' | 'medium' | 'hard' = 'simple'
): string {
  const words: string[] = [];
  const punctuation = [',', '.', '!', '?', ';'];
  const numRate = includeNumbers ? 0.08 : 0;
  const punctRate = includePunctuation ? 0.12 : 0;
  
  let wordPool = SIMPLE_WORDS;
  if (difficulty === 'medium') wordPool = MEDIUM_WORDS;
  else if (difficulty === 'hard') wordPool = HARD_WORDS;

  for (let i = 0; i < count; i++) {
    if (numRate && Math.random() < numRate) {
      words.push(String(Math.floor(Math.random() * 100)));
    } else {
      const word = wordPool[Math.floor(Math.random() * wordPool.length)];
      if (punctRate && Math.random() < punctRate) {
        words.push(word + punctuation[Math.floor(Math.random() * punctuation.length)]);
      } else {
        words.push(word);
      }
    }
  }

  return words.join(' ');
}
