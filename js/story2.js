// The expansion's story: the Hush was only a shadow. Its heart sleeps past the end of time, held by three
// anchors in three more eras. Every line is in both languages, as in story.js.
import { L } from './i18n.js';
import { S, addItem, member, count } from './party.js';
import { ITEMS } from './data.js';
import { SCRIPTS } from './story.js';
import { forgeMenu, bestiary, fishing, strengthBell, beetleRace, prizeBooth, fishTrade, dexCount, paradoxCount } from './systems.js';
import { shopMenu } from './menu.js';
import { SHOPS } from './data.js';

const T = (zh, en) => L(zh, en);
const def = (name, f) => { SCRIPTS[name] = f; };
const has = (id) => !!member(id);

// ======================= the Spire: the Hush was only a shadow =======================
def('hushIntro', async (c, group) => {
  await c.say('寂靜', T('…………', '...........'));
  await c.say('米拉', T('它不會說話。它只是一個會吃時間的洞。', "It can't speak. It's just a hole that eats time."));
  await c.say('蓮', T('那就讓它聽聽，我們三個時代的聲音！', 'Then let it hear the sound of our three eras!'));
  const r = await c.fight(group);
  if (r !== 'win') return;
  c.set('beat_hush'); c.set('spire_cleared');
  c.sfx('rift'); c.shake(40); c.flash('#402060', 0.8); await c.wait(40);
  await c.say('米拉', T('它……散開了？不對，它是一個影子。影子散了，影子的主人還在。', "It... came apart? No. That was a shadow. The shadow is gone, but whatever cast it is still there."));
  await c.say('？？？', T('說得對，小姑娘。', "Quite right, young lady."));
  c.music('interval');
  await c.say('？？？', T('別怕。我是守燈人艾布，在「時隙之間」點燈的老頭子。你們剛才打散的，是寂靜投在這個時代的影子。', "Don't be afraid. I am Ebb the Lamplighter, the old man who keeps the lamps in the Hour Between. What you just broke apart was the shadow the Hush casts on this age."));
  await c.say('守燈人', T('它的心，睡在所有時間的盡頭。跟我來吧，這裡風大。', 'Its heart sleeps past the end of all time. Come with me. It is draughty here.'));
  c.set('interval_open');
  await c.fade(); c.sfx('rift');
  await c.warp('interval', 16.5, 12.4, 'u', true);
  await c.caption([T('第六章', 'Chapter Six'), T('時隙之間', 'The Hour Between')]);
  await c.fadeIn();
  return SCRIPTS.ebb(c);
});

// ======================= the Hour Between =======================
def('ebb', async (c) => {
  if (!c.flag('met_ebb')) {
    c.set('met_ebb');
    await c.say('守燈人', T('歡迎來到時隙之間。這裡不屬於任何時代——就像鐘聲和鐘聲之間的那一點安靜。', 'Welcome to the Hour Between. It belongs to no age, like the little quiet between one toll of a bell and the next.'));
    await c.say('蓮', T('寂靜的心在哪裡？', "Where is the Hush's heart?"));
    await c.say('守燈人', T('北邊那扇門的後面。可是門上有三道鎖，鑰匙在三個時代裡——寂靜在那三個時代扎了根。', 'Behind the door to the north. But the door has three locks, and the keys lie in three ages where the Hush has put down roots.'));
    await c.say('守燈人', T('公元 1820 年的黃銅港，有人想用星鐵做一台讓所有時鐘都一模一樣的機器。', 'In Brasshaven, AD 1820, someone is building a machine of star-iron to make every clock alike.'));
    await c.say('守燈人', T('公元前三萬年的霜搖籃，第一塊星鐵——「母星石」——正在冰河裡醒來。', 'In Frostcradle, 30000 BC, the first star-iron of all, the mother-stone, is waking in the glacier.'));
    await c.say('守燈人', T('還有公元 9000 年的餘燼之城。太陽快熄了，一台悲鳴的機器在那裡替寂靜餵食。', "And in Emberfall, AD 9000, where the sun is going out, a machine of grief feeds the Hush."));
    await c.say('米拉', T('9000 年……薇絲珀說過，她來自一個什麼都會結束的未來。', "9000... Vesper said she came from a future where everything ends."));
    await c.say('守燈人', T('不錯。她的故事還沒說完。去找她吧，她就在你們時代的鐘塔裡。', "Just so. Her story isn't finished. Go and see her; she is in the bell tower of your own time."));
    await c.say('守燈人', T('中間的時隙會帶你們去任何去過的時代。先去黃銅港吧。', 'The rift in the middle will take you to any age you have been to. Go to Brasshaven first.'));
    await c.say('守燈人', T('對了，那邊的鐵砧可以用怪物身上的素材打造裝備；書架上是怪物圖鑑；釣魚的老頭在池邊。都是時間太多的人才會弄的東西。', "Oh, and the anvil there forges gear from what monsters leave behind; the book on the shelf is a monster book; the old fisherman is by the pond. All things for people with too much time."));
    c.set('brass_open');
    await c.hint(T('選單裡多了「圖鑑」和「任務」。', 'The menu now has the Monster Book and Quests.'));
    return;
  }
  // the monster book earns rewards
  const n = dexCount();
  if (n >= 30 && !c.flag('dex30')) { c.set('dex30'); await c.say('守燈人', T(`已經打倒 ${n} 種怪物了？了不起。這個給你。`, `${n} kinds already? Splendid. Take this.`)); return c.give('hasteband'); }
  if (n >= 60 && !c.flag('dex60')) { c.set('dex60'); await c.say('守燈人', T(`${n} 種！你們比我還了解這些傢伙。這是我年輕時穿的鎧甲。`, `${n} kinds! You know them better than I do. This was my armour when I was young.`)); return c.give('starmail'); }
  if (c.flag('cleared')) return c.say('守燈人', T('時間又開始流動了。南邊那扇門……裡面有一口沒響過的鐘，和一個沒走過的未來。小心。', 'Time flows again. The door to the south... holds a bell that never rang, and a future no one took. Take care.'));
  if (c.flag('heart_open')) return c.say('守燈人', T('三把鑰匙都到齊了。北邊的門開了——寂靜的心就在後面。', 'All three keys are here. The north door is open; the heart of the Hush lies beyond.'));
  if (c.flag('ember_open')) return c.say('守燈人', T('最後是餘燼之城。如果薇絲珀願意，就帶她一起去吧。', "Emberfall is last. If Vesper is willing, take her with you."));
  if (c.flag('frost_open')) return c.say('守燈人', T('下一把鑰匙在霜搖籃。冷得很，多穿點。', 'The next key is in Frostcradle. It is bitterly cold; wrap up.'));
  return c.say('守燈人', T('黃銅港的鑰匙在鑄造廠的機器心臟裡。', "Brasshaven's key is in the heart of the foundry's machine."));
});
def('eraGate', async (c) => {
  const opts = [['present', T('公元 1250 年・燈河鎮', 'AD 1250 · Lanternford')]];
  if (c.flag('arrived_future')) opts.push(['future', T('公元 2400 年・靜止之年', 'AD 2400 · Stillfall')]);
  if (c.flag('arrived_ancient')) opts.push(['ancient', T('公元前 3000 年・根野', '3000 BC · the Rootwild')]);
  if (c.flag('brass_open')) opts.push(['brass', T('公元 1820 年・黃銅港', 'AD 1820 · Brasshaven')]);
  if (c.flag('frost_open')) opts.push(['frost', T('公元前 30000 年・霜搖籃', '30000 BC · Frostcradle')]);
  if (c.flag('ember_open')) opts.push(['ember', T('公元 9000 年・餘燼之城', 'AD 9000 · Emberfall')]);
  const k = await c.ask(null, T('時隙在旋轉。要去哪個時代？', 'The rift turns. Which era?'), [...opts.map((o) => o[1]), T('不去', 'Stay')]);
  if (k < 0 || k >= opts.length) return;
  c.sfx('rift');
  return travel(c, opts[k][0]);
});
async function travel(c, to) {
  if (to === 'present') await c.warp('lantern', 20.5, 19.6, 'd');
  if (to === 'future') await c.warp('stillfall', 20.5, 18.6, 'd');
  if (to === 'ancient') await c.warp('rootwild', 4.5, 16.5, 'r');
  if (to === 'brass') await c.warp('brass', 20.5, 19.6, 'd');
  if (to === 'frost') await c.warp('tundra', 4.5, 16.5, 'r');
  if (to === 'ember') await c.warp('ember', 20.5, 19.6, 'd');
  if (to === 'interval') await c.warp('interval', 16.5, 14.6, 'd');
}
// the rifts in each era now also lead to the Hour Between
def('riftGate', async (c) => {
  const here = c.era();
  const opts = [];
  if (c.flag('interval_open')) opts.push(['interval', T('時隙之間', 'The Hour Between')]);
  if (c.flag('can_return_present') && here !== 'present') opts.push(['present', T('公元 1250 年・燈河鎮', 'AD 1250 · Lanternford')]);
  if (c.flag('arrived_future') && here !== 'future' && c.flag('can_return_present')) opts.push(['future', T('公元 2400 年・靜止之年', 'AD 2400 · Stillfall')]);
  if (c.flag('beat_warden') && here !== 'ancient') opts.push(['ancient', T('公元前 3000 年・根野', '3000 BC · the Rootwild')]);
  if (!opts.length) return c.say(null, T('時隙在旋轉，可是還不知道它通往哪裡。', "The rift turns, but you don't yet know where it leads."));
  const k = await c.ask(null, T('時隙在旋轉。要去哪裡？', 'The rift turns. Where to?'), [...opts.map((o) => o[1]), T('不去', 'Stay')]);
  if (k < 0 || k >= opts.length) return;
  c.sfx('rift');
  return travel(c, opts[k][0]);
});
def('shopInterval', async (c) => { await c.say(null, T('一台會走路的小販賣機：「歡迎光臨，時間旅人！」', 'A little vending machine on legs: "Welcome, time traveller!"')); return shopMenu(SHOPS.interval); });
def('forge', async (c) => { await c.say(null, T('鐵砧還熱著。素材和金幣，就能打出新的裝備。', 'The anvil is still warm. Materials and gold make new gear.')); return forgeMenu(); });
def('dexBook', async () => bestiary());
def('oldFisher', async (c) => {
  if (!c.flag('got_rod')) {
    await c.say('老漁夫', T('這個池子裡的魚，是從時間的河流裡游進來的。運氣好的話，還能釣到「時之魚」。', 'The fish in this pond swim in from the river of time. With luck you might hook a Timefish.'));
    await c.say('老漁夫', T('拿去，我多一支釣竿。霜搖籃的冰洞、根野的湖，都釣得到魚。', 'Here, I have a spare rod. You can fish at the ice hole in Frostcradle and the lake in the Rootwild too.'));
    c.set('got_rod'); return c.give('rod');
  }
  const kinds = Object.keys(S.fish || {}).length;
  if (kinds >= 5 && !c.flag('fish_reward')) { c.set('fish_reward'); await c.say('老漁夫', T('五種魚都釣到了？你是真正的釣手。這個鈴鐺送你，戰鬥前搖一搖，什麼都快人一步。', "All five kinds? You're a true angler. Have this bell; give it a shake before a fight and you'll be a step ahead."));
    return c.give('firstbell'); }
  return c.say('老漁夫', T(`你釣過 ${kinds} 種魚了。黃銅港的市集可以用魚換代幣。`, `You've caught ${kinds} kinds. The fair in Brasshaven trades fish for tokens.`));
});
def('fishSpot', async (c) => {
  const spot = c.map().id === 'interval' ? 'interval' : c.map().id === 'camp' ? 'ice' : 'lake';
  return fishing(spot);
});
def('heartDoor', async (c) => {
  if (!c.flag('heart_open')) {
    const n = ['hourkey1', 'hourkey2', 'hourkey3'].filter((k) => count(k)).length;
    await c.say(null, T(`一扇沒有把手的門，上面有三個鑰匙孔。（${n}／3）`, `A door with no handle and three keyholes. (${n}/3)`));
    c.push(0, 20); return;
  }
  if (await c.ask(null, T('紅色的門通往寂靜之心。準備好了嗎？', 'The red door leads to the Heart of the Hush. Ready?'), [T('進去', 'Go in'), T('等一下', 'Not yet')]) !== 0) { c.push(0, 20); return; }
  await c.warp('heart1', 12.5, 40.6, 'u');
  if (!c.flag('heart_caption')) { c.set('heart_caption'); await c.caption([T('終章', 'The Last Chapter'), T('寂靜之心', 'The Heart of the Hush')]); }
});
def('unrungDoor', async (c) => {
  if (!c.flag('cleared')) { await c.say(null, T('南邊的路通往一片沒有光的地方。現在還過不去。', 'The southern path leads somewhere without light. You cannot go yet.')); c.push(0, -20); return; }
  await c.warp('unrung', 8.5, 13.2, 'u');
});

// ======================= Brasshaven, AD 1820 =======================
def('arriveBrass', async (c) => {
  c.set('arrived_brass');
  await c.caption([T('第七章　公元 1820 年', 'Chapter Seven · AD 1820'), T('黃銅港', 'Brasshaven')]);
  await c.say('蓮', T('這裡……又是燈河鎮？鐘塔還在，可是到處都是煙囪和齒輪！', "Is this... Lanternford again? The tower's still here, but it's all chimneys and gears!"));
  if (has('silas')) await c.say('賽勒斯', T('五百多年以後就變成這樣啦。再過五百年，又會變成我住的那片廢墟。', "This is it, five hundred years on. Another five hundred and it'll be the ruins I live in."));
  c.sfx('toll'); await c.wait(30);
  await c.say('鐵腕巡警', T('「調節時刻」到了！所有人把錶對準公會鐘塔！慢一秒的，關進鑄造廠！', 'It is the Regulated Hour! Everyone set your watches by the Guild Tower! Anyone a second slow goes to the foundry!'));
  if (has('mira')) await c.say('米拉', T('（小聲）……這裡，我好像來過。', '(quietly) ...I think I have been here before.'));
  await c.hint(T('鎮北西邊的鐘錶行、東北的學院、東邊的市集。先到處問問。', "A watch shop in the north-west, an academy in the north-east, a fair to the east. Ask around first."));
});
def('brassGent', async (c) => c.say('紳士', c.flag('beat_regulator') ? T('我的錶慢了三分鐘！哈哈，好久沒這麼開心了。', 'My watch is three minutes slow! Ha! I have not felt this good in years.') : T('卡爾德教授的調節機，讓全城的鐘一秒不差。效率很好……就是誰也不敢遲到。', "Professor Calder's Regulator keeps every clock in the city to the second. Very efficient... only no one dares be late.")));
def('brassLady', async (c) => c.say('淑女', c.flag('beat_regulator') ? T('聽說鑄造廠的大機器停了。今晚的市集會開到很晚喔。', "They say the great machine in the foundry has stopped. The fair will run late tonight.") : T('市集是唯一可以不看錶的地方。去玩玩吧，可以換到好東西。', "The fair is the one place you needn't watch the clock. Go and play; there are good prizes.")));
def('brassSailor', async (c) => c.say('水手', T('北方運來一塊黑色的石頭，冷得船都結冰了。教授把它搬進了鑄造廠。', 'A black stone came down from the north, so cold the ship iced over. The professor had it carried into the foundry.')));
def('brassCop', async (c) => c.say('鐵腕巡警', T('沒事別亂晃。鑄造廠是禁區。', 'Move along. The foundry is off limits.')));
def('brassInn', async (c) => c.inn(80));
def('shopBrass', async (c) => { await c.say('商人', T('黃銅港的貨，五個時代最好！', "Brasshaven goods, the finest of five ages!")); return c.shop('brass'); });
def('brassStudent', async (c) => c.say('學生', has('mira') && !c.flag('mira_quest') ? T('咦……米拉貝爾學姊？您不是十年前失蹤了嗎？教授到現在還在找您的筆記！', "Eh... Miss Mirabel? Didn't you vanish ten years ago? The professor is still looking for your notes!") : T('學院裡有一台叫「芬維克七號」的人偶，守著教授的書桌。', 'There is an automaton called Fenwick Seven in the academy. It guards the professor\'s desk.')));
def('foundryShut', async (c) => { await c.say('鐵腕巡警', T('鑄造廠的水路禁止通行！', 'The foundry waterway is closed!')); c.push(20, 0); });
def('hattie', async (c) => {
  if (!c.flag('met_hattie')) {
    c.set('met_hattie');
    await c.say('哈蒂', T('歡迎光臨……啊，抱歉，店快關了。巡警說我的錶「走得太自由」。', "Welcome... oh, sorry, the shop is closing. The constables say my watches run 'too freely'."));
    await c.say('哈蒂', T('卡爾德教授想讓全城只有一個時間。他從北方弄來一塊會唱歌的黑石頭，做成調節機的心臟。', "Professor Calder wants one single time for the whole city. He got a black stone that sings from the north and made it the Regulator's heart."));
    await c.say('蓮', T('會唱歌的黑石頭……是星鐵！', 'A black stone that sings... star-iron!'));
    await c.say('哈蒂', T('你們要去阻止他？鑄造廠的後門在碼頭西邊的水路。這把鑰匙給你們——我爸爸以前是那裡的工匠。', "You mean to stop him? The foundry's back way is the waterway west of the docks. Take this key; my father worked there."));
    c.set('foundry_open');
    await c.notice(T('碼頭西邊的水路打開了。', 'The waterway west of the docks is open.'));
    if (has('silas')) {
      await c.say('賽勒斯', T('……等一下。這間店的招牌——「哈蒂鐘錶行」。我奶奶的懷錶背面，刻的就是這個名字。', "...Wait. The sign on this shop: Hattie's Watches. That's the name engraved on the back of my grandmother's watch."));
      await c.say('哈蒂', T('咦？我還沒做過要刻名字的錶呢。……不過，我正打算做一支「永遠不會停的錶」。', "Oh? I've never engraved one yet... though I am planning to make a watch that never stops."));
      c.set('silas_quest');
    }
    return;
  }
  if (c.flag('silas_quest') && !c.flag('ep_silas') && has('silas')) return SCRIPTS.silasEpisode(c);
  if (c.flag('ep_silas')) return c.say('哈蒂', T('那支錶，我會做一輩子的。謝謝你們。', "I'll spend my life on that watch. Thank you."));
  return c.say('哈蒂', T('鑄造廠在碼頭西邊。小心卡爾德教授，他其實不是壞人……只是太怕亂了。', "The foundry is west of the docks. Careful of Professor Calder. He's not wicked... just too frightened of disorder."));
});
def('hattieShelf', async (c) => c.say(null, T('架上排滿了錶，每一支都走在不同的秒數上。', 'Shelves of watches, each ticking on a different second.')));
def('silasEpisode', async (c) => {
  await c.say('賽勒斯', T('哈蒂……那支「永遠不會停的錶」，能讓我看看嗎？', 'Hattie... the watch that never stops. Can I see it?'));
  await c.say('哈蒂', T('還只是個殼呢。我想讓它的心跳得像人一樣，不聽任何鐘塔的話。', "It's only a case so far. I want its heart to beat like a person's, listening to no tower at all."));
  c.sfx('door'); await c.wait(20);
  await c.say('鐵面隊長', T('哈蒂・溫特斯！妳的錶全部不準，依調節法，沒收店面！', 'Hattie Winters! Every watch here is wrong. Under the Regulation Act, this shop is seized!'));
  await c.say('賽勒斯', T('這間店，我一千年後還要用。滾出去！', "I'll be needing this shop a thousand years from now. Get out!"));
  const r = await c.battle(['ironchief', 'constable'], 7.5, 4.8, { boss: true });
  if (r !== 'win') return;
  c.set('ep_silas');
  await c.say('哈蒂', T('你……為什麼這麼拚命？', 'You... why fight so hard?'));
  await c.say('賽勒斯', T('因為妳做的錶，救過我的命。在一個大家都停住的世界裡，它的心一直在跳。', "Because a watch you made saved my life. In a world where everyone had stopped, its heart kept beating."));
  await c.say('哈蒂', T('……那我一定要把它做出來。這支是試作品，先給你。', "...Then I must make it. This one's a prototype. Take it for now."));
  await c.give('hattiewatch');
  await c.notice(T('賽勒斯學會了「力場盾」！', 'Silas learned Force Field!'));
});
def('academyStudent', async (c) => c.say('學生', T('教授說，時間應該像機器一樣整齊。可是米拉貝爾學姊以前說，時間應該像河一樣。', 'The professor says time should be tidy like a machine. Miss Mirabel used to say it should be like a river.')));
def('academyChild', async (c) => c.say('小孩', T('芬維克七號會發射光線喔，好帥！', 'Fenwick Seven shoots beams! So cool!')));
def('calderDesk', async (c) => {
  if (has('mira') && !c.flag('mira_quest')) {
    c.set('mira_quest');
    await c.say('米拉', T('……這是卡爾德老師的書桌。我十年前在這裡讀書，叫米拉貝爾。', '...This is Professor Calder\'s desk. I studied here ten years ago, as Mirabel.'));
    await c.say('蓮', T('米拉，你是 1820 年的人？', 'Mira, you are from 1820?'));
    await c.say('米拉', T('我寫了一份時間的理論，老師拿去造調節機。我嚇壞了，用理論裡的方法逃到了過去……逃到燈河鎮。', "I wrote a theory of time, and he took it to build the Regulator. I was frightened, so I used the theory itself to run into the past... to Lanternford."));
    await c.say('米拉', T('那口鐘的聲音會吸引我，大概也不是巧合。我的筆記一定還鎖在這裡面。', "It is no accident the bell's hum drew me. My notes must still be locked in here."));
    c.sfx('switch'); await c.say(null, T('書桌後面的人偶動了起來！', 'The automaton behind the desk starts to move!'));
    return;
  }
  return c.say(null, c.flag('ep_mira') ? T('空空的書桌。抽屜裡剩下一張紙：「時間像河。」', 'An empty desk. One sheet left in the drawer: "Time is like a river."') : T('卡爾德教授的日記：「星鐵在晚上會說話。它說，只要所有的鐘一致，就不會再有人失去任何東西。」', 'Professor Calder\'s diary: "The star-iron speaks at night. It says if every clock agrees, no one will ever lose anything again."'));
});
def('fenwickFight', async (c, group) => {
  await c.say('芬維克七號', T('偵測到入侵者。偵測到……米拉貝爾。執行：保護筆記。', 'Intruders detected. Detected... Mirabel. Executing: protect the notes.'));
  const r = await c.fight(group);
  if (r !== 'win') return;
  c.set('ep_mira');
  await c.give('notes');
  await c.say('米拉', T('找到了。……我以前寫的最後一頁是：「時間不能被整齊地切開，但可以被溫柔地放慢。」', 'Found them. ...The last page I wrote says: "Time cannot be cut neatly, but it can be gently slowed."'));
  await c.say('米拉', T('我逃了十年。這次，我要用它來保護大家。', 'I ran for ten years. This time I will use it to protect everyone.'));
  await c.give('miraquill');
  await c.notice(T('米拉學會了「遲滯之環」！', 'Mira learned Slow Ring!'));
});
def('calderFight', async (c, group) => {
  await c.say('卡爾德教授', T('客人？真不巧，調節時刻快到了。', 'Visitors? How inconvenient. The Regulated Hour is almost here.'));
  if (c.flag('ep_mira')) await c.say('卡爾德教授', T('……米拉貝爾。妳回來了。帶著妳那套「河流」的天真想法。', '...Mirabel. You came back. With your naive ideas about rivers.'));
  await c.say('蓮', T('那塊星鐵在騙你！它不是讓時間整齊，是讓時間停下來！', "The star-iron is lying to you! It doesn't make time tidy, it makes time stop!"));
  await c.say('卡爾德教授', T('停下來又如何？我的妻子在一個「慢了三分鐘」的早上走了。如果所有的鐘都一致，就不會再有那三分鐘。', "And if it does stop? My wife died on a morning when I was three minutes late. If every clock agrees, there will never be another three minutes."));
  const r = await c.fight(group);
  if (r !== 'win') return;
  c.set('beat_calder'); c.set('valve_known');
  await c.say('卡爾德教授', T('……我只是……不想再晚到了。', "...I only... didn't want to be late again."));
  await c.say('米拉', T('老師。晚到不是罪。我們能做的，是好好珍惜還來得及的時間。', "Professor. Being late is not a crime. What we can do is treasure the time we still have."));
  await c.say('卡爾德教授', T('調節機……已經不聽我的了。它在聽石頭的。拿著這個——水閘的扳手。西邊的水閘一直關著，下游的人很久沒有乾淨的水了。', "The Regulator... no longer obeys me. It obeys the stone. Take this: the floodgate wrench. The west sluice has been shut so long the people downstream have no clean water."));
  await c.give('valvekey');
});
def('floodValve', async (c) => {
  if (c.flag('valve_open')) return c.say(null, T('水閘開著，水嘩嘩地流向下游。', 'The floodgate is open; water rushes downstream.'));
  if (!count('valvekey')) return c.say(null, T('一個生鏽的大水閘。需要扳手才能轉開。', 'A great rusted floodgate. It needs a wrench.'));
  if (await c.ask(null, T('用扳手打開水閘嗎？', 'Open the floodgate with the wrench?'), [T('打開', 'Open'), T('不要', 'Leave it')]) !== 0) return;
  c.sfx('gate'); c.shake(20); await c.wait(30);
  c.set('valve_open'); addItem('valvekey', -1);
  await c.say(null, T('水閘打開了。水流沖向城外，流向很遠很遠的未來。', 'The floodgate opens. Water pours out of the city, towards a far, far future.'));
  if (has('silas')) await c.say('賽勒斯', T('……靜止之年的東南邊，以前好像有一條乾掉的河道。', "...There used to be a dry riverbed south-east in Stillfall."));
});
def('regulatorGate', async (c) => { await c.say(null, T('前面傳來巨大的齒輪聲。卡爾德教授擋在路上。', 'Great gears grind ahead. Professor Calder blocks the way.')); c.push(0, 20); });
def('regulatorFight', async (c, group) => {
  await c.say(null, T('巨大的鑄鐵機器張開了胸口。裡面的黑色星鐵發出冰冷的光。', 'The great iron machine opens its chest. Black star-iron inside glows cold.'));
  await c.hint(T('它上緊發條的時候，用雷打它可以打斷。', 'When it winds itself up, a thunder strike will snap the spring.'));
  const r = await c.fight(group);
  if (r !== 'win') return;
  c.set('beat_regulator'); c.set('frost_open');
  c.sfx('chime'); c.flash('#ffe8a0', 0.7); await c.wait(40);
  await c.say(null, T('調節機停了。城裡的鐘，一個接一個地走回自己的秒數。', 'The Regulator stops. One by one, the clocks of the city drift back to their own seconds.'));
  await c.give('hourkey1');
  await c.say('米拉', T('星鐵碎片說它是從北方來的……那就是母星石。下一把鑰匙在霜搖籃。', 'The shard came from the north... from the mother-stone. The next key is in Frostcradle.'));
  if (!c.flag('vesper_hint') && !has('vesper')) { c.set('vesper_hint'); await c.say('蓮', T('回時隙之間吧。……也該去鐘塔找薇絲珀了。', "Back to the Hour Between. ...And it's time we went to see Vesper in the tower.")); }
});
def('brassGreyfang', async (c) => c.say('灰牙的曾曾孫', T('我的曾曾爺爺是個改過自新的大盜，後來當了一輩子的護衛。這枚金幣是家傳的，說要送給「鐘匠的小鬼」。……是你嗎？', 'My great-great-grandfather was a bandit who went straight and guarded people all his life. This coin came down the family, "for the clockmaker\'s brat". ...Is that you?')).then(() => (!c.flag('got_coin') ? (c.set('got_coin'), c.give('luckycoin')) : null)));
// the fair
def('strengthBell', async (c) => { await c.say('叫賣人', T('來喔來喔！把槌子敲下去，讓鐘響起來！鐘響就送代幣！', 'Roll up! Swing the hammer and ring the bell! Ring it for tokens!')); return strengthBell(); });
def('beetleRace', async (c) => { await c.say('賽蟲老闆', T('發條甲蟲賽跑！押對了，代幣翻倍！', 'Clockwork beetle racing! Pick the winner and multiply your tokens!')); return beetleRace(); });
def('prizeBooth', async (c) => { await c.say('獎品攤', T('代幣可以換這些好東西喔。', 'Tokens buy these lovely things.')); return prizeBooth(); });
def('fishTrader', async (c) => { await c.say('魚販', T('新鮮的魚？我用代幣跟你換！', 'Fresh fish? I will pay in tokens!')); return fishTrade(); });
def('fairKid', async (c) => c.say('小孩', T('紅色的火花號跑最快，可是賠率最低。黑鐵號最慢……可是有時候會爆衝喔！', 'Sparky is fastest but pays least. Ironback is slowest... but sometimes it bolts!')));

// ======================= Frostcradle, 30000 BC =======================
def('arriveFrost', async (c) => {
  c.set('arrived_frost');
  await c.caption([T('第八章　公元前 30000 年', 'Chapter Eight · 30000 BC'), T('霜搖籃', 'Frostcradle')]);
  await c.say('蓮', T('好冷！整片大地都是白的……', "So cold! The whole land is white..."));
  if (has('kaya')) await c.say('卡雅', T('比根野早兩萬七千年。這裡的人，說不定是我們的祖先。', "Twenty-seven thousand years before the Rootwild. The people here might be our ancestors."));
  await c.say('？？？', T('退後！狼群在這裡！', 'Stay back! The wolves are here!'));
});
def('niloMeet', async (c) => c.say('少年', T('小心狼！', 'Mind the wolves!')));
def('niloFight', async (c, group) => {
  await c.say('少年', T('你們是從天上的洞掉下來的？要打就一起打！', 'You fell out of the hole in the sky? If you can fight, fight with me!'));
  const r = await c.fight(group);
  if (r !== 'win') return;
  await c.say('少年', T('……你們很強。我叫尼洛，猛獁獵人的兒子。', '...You are strong. I am Nilo, son of the mammoth hunters.'));
  await c.say('尼洛', T('冰河裡的「母星石」最近在唱歌，狼和熊都瘋了。北邊的霜牙族也被歌聲迷住，想把它挖出來。', 'The mother-stone in the glacier has been singing lately, and the wolves and bears have gone mad. The Frostfang to the north are bewitched by the song too, and want to dig it out.'));
  await c.say('蓮', T('我們就是來讓它安靜的。', "We came to quiet it."));
  await c.say('尼洛', T('那我帶你們去營地，見大巫婆尤卡。她知道怎麼讓石頭睡覺。', "Then I'll take you to camp to see Yuka, our great wise-woman. She knows how to make the stone sleep."));
  c.join('nilo');
  await c.notice(T('尼洛加入了隊伍！', 'Nilo joined the party!'));
  await c.hint(T('同時最多三人出戰。在選單的「隊伍」換人。', 'Three can fight at once. Swap people under Party.'));
});
def('yuka', async (c) => {
  if (!c.flag('met_yuka')) {
    c.set('met_yuka');
    await c.say('尤卡', T('天上來的孩子們。我夢見過你們——拿著劍的鐘匠，和會唱歌的弓。', 'Children from the sky. I dreamed of you: a bellmaker with a sword, and a bow that sings.'));
    await c.say('尤卡', T('母星石是從星星之間掉下來的「飢餓」。我們世世代代唱「融冰之歌」，讓它睡著。可是今年，它醒了。', 'The mother-stone is a hunger that fell from between the stars. For generations we sang the Thaw-song to keep it asleep. This year it woke.'));
    await c.say('尤卡', T('冰河的入口在霜原北邊。守著它的巨熊被石頭迷住了。打倒牠，我就能再唱一次歌。', 'The glacier mouth is north of the Frost Plain. The great bear guarding it is bewitched by the stone. Beat it, and I can sing once more.'));
    c.set('glacier_open');
    await c.notice(T('霜原北邊的冰河打開了。', 'The glacier north of the Frost Plain is open.'));
    if (has('kaya')) {
      await c.say('卡雅', T('那個……您手上那根骨頭，是要做笛子的嗎？', 'Um... that bone in your hands. Are you making a flute?'));
      await c.say('尤卡', T('是啊。可是要讓它吹出「開始的聲音」，得用月鹿的角磨孔。月鹿住在東北的山脊上，很兇。', 'I am. But to make it play the sound of beginning, the holes must be bored with a moon elk antler. The moon elk lives on the north-east ridge, and it is fierce.'));
      await c.say('卡雅', T('……開始的聲音。奶奶的骨笛，原來是從這裡開始的。我去！', "...The sound of beginning. So Grandmother's flute began here. I'll go!"));
      c.set('kaya_quest');
    }
    return;
  }
  if (c.flag('kaya_quest') && count('antler') && !c.flag('ep_kaya')) {
    addItem('antler', -1);
    await c.say('尤卡', T('月鹿的角！……好，看著。', "A moon elk antler! ...Good. Watch."));
    await c.fade(); c.sfx('chime'); await c.wait(60); await c.fadeIn();
    await c.say('尤卡', T('這是第一支骨笛。它比我活得久，會傳給很多很多代的孩子……也傳給妳。', 'This is the first bone flute. It will outlive me, passing through many, many generations of children... and to you.'));
    if (has('kaya')) await c.say('卡雅', T('奶奶……我是說，尤卡婆婆。謝謝您。', "Grandmother... I mean, Grandmother Yuka. Thank you."));
    c.set('ep_kaya'); await c.give('songbone');
    return c.notice(T('卡雅學會了「晨曲」！', 'Kaya learned Dawn Song!'));
  }
  if (c.flag('beat_rimeback')) return c.say('尤卡', T('石頭睡了。孩子們可以安心地出去打獵了。', 'The stone sleeps. The children can go hunting without fear.'));
  return c.say('尤卡', T('冰河在霜原的北邊。', 'The glacier lies north of the Frost Plain.'));
});
def('campHunter', async (c) => {
  if (c.flag('calf_saved')) return c.say('獵人', T('小猛獁回來了！尼洛那小子，連狼后都打得贏。', "The calf is back! That Nilo even beat the wolf queen."));
  if (has('nilo') && !c.flag('calf_quest')) {
    await c.say('獵人', T('尼洛！不好了，你養的那隻小猛獁被雪鬃狼后叼走了，拖到西南邊的狼之谷！', "Nilo! Bad news: the mammoth calf you raised was carried off by the Snowmane Matriarch, to Wolf Hollow in the south-west!"));
    await c.say('尼洛', T('「圓圓」！……蓮，拜託你們，陪我去一趟。', "Roundy! ...Ren, please. Come with me."));
    c.set('calf_quest'); return c.notice(T('霜原西南邊的狼之谷打開了。', 'Wolf Hollow, south-west of the Frost Plain, is open.'));
  }
  return c.say('獵人', T('霜牙族的人眼睛都變白了。他們不是壞人，是被石頭的歌迷住了。', "The Frostfang's eyes have gone white. They aren't wicked; the stone's song has them."));
});
def('campChild', async (c) => c.say('小孩', T('冰洞裡有魚喔！冰魚吃了會讓腦袋變清楚。', 'There are fish in the ice hole! Icefish clear your head.')));
def('shopCamp', async (c) => { await c.say('獵人的女人', T('你們的亮晶晶的金屬，我們很喜歡。', 'We like your shiny metal very much.')); return c.shop('camp'); });
def('calfNpc', async (c) => c.say(null, c.flag('calf_saved') ? T('小猛獁「圓圓」開心地甩著鼻子。', 'Roundy the mammoth calf swings its trunk happily.') : T('小猛獁縮成一團，發抖著。', 'The mammoth calf is curled up, shaking.')));
def('packMotherFight', async (c, group) => {
  if (has('nilo')) await c.say('尼洛', T('放開圓圓！', 'Let Roundy go!'));
  const r = await c.fight(group);
  if (r !== 'win') return;
  c.set('calf_saved'); c.set('ep_nilo');
  await c.say(null, T('小猛獁跑過來，用鼻子蹭著尼洛。', 'The calf runs over and nuzzles Nilo with its trunk.'));
  await c.say('尼洛', T('圓圓……以後你會長得很大很大，大到可以載著好多人。', "Roundy... one day you'll grow huge, big enough to carry lots of people."));
  await c.give('mammothtusk');
  await c.notice(T('尼洛學會了「圍爐」！', 'Nilo learned Hearth!'));
});
def('moonElkFight', async (c, group) => {
  await c.say(null, T('山脊上站著一頭發著銀光的鹿。', 'A deer that glows silver stands on the ridge.'));
  const r = await c.fight(group);
  if (r !== 'win') return;
  await c.say(null, T('月鹿低下頭，把一支角輕輕放在雪地上，然後消失在月光裡。', 'The moon elk lowers its head, sets one antler gently on the snow, and fades into the moonlight.'));
  await c.give('antler');
});
def('glacierShut', async (c) => { await c.say(null, T('冰河的入口被暴風雪封住了。先去東邊的營地看看。', 'A blizzard seals the glacier mouth. Try the camp to the east first.')); c.push(0, 20); });
def('rimebackFight', async (c, group) => {
  await c.say(null, T('一頭比房子還大的白熊，背上長滿了冰刺。牠的眼睛跟母星石一樣冷。', 'A white bear bigger than a house, its back bristling with ice. Its eyes are as cold as the mother-stone.'));
  await c.hint(T('冰甲會擋住大部分的物理攻擊。用火把它融掉！', 'Ice armour turns most blows aside. Melt it with fire!'));
  const r = await c.fight(group);
  if (r !== 'win') return;
  c.set('beat_rimeback');
  await c.say('尼洛', T('牠……醒過來了，自己走回洞裡去了。', "It... woke up, and walked back to its den on its own."));
});
def('motherstone', async (c) => {
  if (!c.flag('beat_rimeback')) return c.say(null, T('冰裡的黑色石頭在唱歌。有東西在前面守著。', 'A black stone in the ice is singing. Something guards it.'));
  if (c.flag('stone_asleep')) return c.say(null, T('母星石安靜地睡著。', 'The mother-stone sleeps quietly.'));
  await c.say('尤卡', T('（尤卡婆婆氣喘吁吁地趕到了）……好孩子們。現在，一起唱吧。', '(Grandmother Yuka arrives, out of breath) ...Good children. Now, sing with me.'));
  c.music('sad'); await c.wait(30);
  await c.say(null, T('尤卡和尼洛唱起融冰之歌。那是一首關於春天的歌：冰會融化，雪會結束，然後一切重新開始。', 'Yuka and Nilo sing the Thaw-song, a song about spring: ice melts, snow ends, and everything begins again.'));
  c.sfx('chime'); c.flash('#d0f0ff', 0.8); await c.wait(60);
  await c.say(null, T('母星石的光慢慢暗下來。一滴冰淚落在蓮的手心，變成了一把透明的鑰匙。', "The mother-stone's light slowly dims. A tear of ice falls into Ren's palm and becomes a clear key."));
  c.set('stone_asleep'); c.set('ember_open'); c.music('glacier');
  await c.give('hourkey2');
  await c.say('尤卡', T('結束的歌，也是開始的歌。去吧，最後一把鑰匙在太陽熄滅的地方。', 'A song of ending is a song of beginning too. Go. The last key lies where the sun goes out.'));
});

// ======================= Vesper, and Emberfall, AD 9000 =======================
def('vesperTower2', async (c) => {
  if (!c.flag('interval_open')) return c.say('薇絲珀', T('我在這裡學著說再見。……不太順利。', "I'm learning to say goodbye here. ...It isn't going well."));
  await c.say('薇絲珀', T('守燈人告訴過我，你們會來。寂靜的心……還在吃我的時代。', "The Lamplighter told me you would come. The Hush's heart... is still eating my age."));
  await c.say('薇絲珀', T('公元 9000 年，太陽快熄了。我的妹妹露明，在最後一個春天走了。我造了一台機器，想把她最後的那一刻留住。', "AD 9000. The sun is going out. My little sister Lumen died in the last spring. I built a machine to hold on to her last moment."));
  await c.say('薇絲珀', T('那台機器——悲鳴機關——把我的悲傷變成了寂靜的食物。是我讓它長大的。', "That machine, the Grief Engine, turned my sorrow into food for the Hush. I am the one who made it grow."));
  if (await c.ask('薇絲珀', T('讓我跟你們一起去。我要親手結束它。', 'Let me come with you. I want to end it with my own hands.'), [T('一起走吧', 'Come with us'), T('再想想', 'Let me think')]) !== 0) return c.say('薇絲珀', T('……我會在這裡等。', "...I'll wait here."));
  await c.say('蓮', T('一起走吧，薇絲珀。', "Let's go together, Vesper."));
  c.join('vesper');
  await c.notice(T('薇絲珀加入了隊伍！', 'Vesper joined the party!'));
});
def('arriveEmber', async (c) => {
  c.set('arrived_ember');
  await c.caption([T('第九章　公元 9000 年', 'Chapter Nine · AD 9000'), T('餘燼之城', 'Emberfall')]);
  await c.say('蓮', T('天空是紅的……太陽好大，卻一點也不暖。', "The sky is red... the sun is huge, but not warm at all."));
  if (has('vesper')) await c.say('薇絲珀', T('我回來了。……這裡是我出生的城市。北邊那座塔，就是悲鳴機關。', "I'm home. ...This is the city I was born in. The tower to the north is the Grief Engine."));
  else await c.say('米拉', T('城北的那座塔在發出哭聲一樣的聲音。', 'The tower north of the city is making a sound like weeping.'));
});
def('emberFolk', async (c) => c.say('戴面具的人', c.flag('beat_grief') ? T('天空……變亮了一點點。太陽還是會熄，可是我們想好好看完最後的日落。', "The sky... is a little brighter. The sun will still go out, but we want to watch the last sunset properly.") : T('鑄鐘人薇絲珀離開以後，塔就一直在哭。大家都戴上面具，不想再感覺任何東西。', "Since Vesper the Bellwright left, the tower has wept without stopping. Everyone wears masks; no one wants to feel anything any more.")));
def('emberInn', async (c) => c.inn(120));
def('shopEmber', async (c) => { await c.say(null, T('最後一台還在營業的販賣機。', 'The last vending machine still open for business.')); return c.shop('ember'); });
def('lumenGrave', async (c) => {
  if (!has('vesper')) return c.say(null, T('一座小小的墓。墓碑上寫著：「露明。她喜歡春天。」', 'A small grave. The stone reads: "Lumen. She loved spring."'));
  if (c.flag('grave_seen')) return c.say('薇絲珀', T('露明，再等我一下。', 'Lumen, wait for me a little longer.'));
  c.set('grave_seen');
  await c.say('薇絲珀', T('「露明。她喜歡春天。」……是我刻的。', '"Lumen. She loved spring." ...I carved that.'));
  await c.say('薇絲珀', T('她最後一句話是：「姊姊，明年的花會比今年的漂亮。」可是那之後，就再也沒有明年了。', 'Her last words were, "Sister, next year\'s flowers will be prettier than this year\'s." But after that, there was never another year.'));
  await c.give('photo');
});
def('lumenFight', async (c, group) => {
  await c.say('？？？', T('姊姊……妳回來了。', 'Sister... you came back.'));
  if (has('vesper')) {
    await c.say('薇絲珀', T('露明……不，妳不是她。妳是機器用我的回憶做出來的影子。', "Lumen... no. You aren't her. You're a shadow the machine made from my memories."));
    await c.say('露明之影', T('留下來吧。在這裡，最後的那一刻永遠不會結束。', 'Stay. Here, the last moment never ends.'));
  } else await c.say('露明之影', T('你們是誰？別碰姊姊的機器！', "Who are you? Don't touch my sister's machine!"));
  const r = await c.fight(group);
  if (r !== 'win') return;
  c.set('beat_lumen');
  if (has('vesper')) {
    c.music('sad');
    await c.say(null, T('影子散開的地方，飄下一點溫暖的光。', 'Where the shadow came apart, a little warm light drifts down.'));
    await c.say('露明', T('姊姊，不要再留住我了。花謝了，明年才會再開呀。', "Sister, stop holding on to me. Flowers have to fall, or they can't bloom next year."));
    await c.say('薇絲珀', T('……嗯。再見，露明。謝謝妳當我的妹妹。', '...Yes. Goodbye, Lumen. Thank you for being my sister.'));
    c.set('ep_vesper');
    await c.give('lumenstar');
    await c.notice(T('薇絲珀學會了「告別」！', 'Vesper learned Farewell!'));
    c.music('engine');
  } else await c.say('米拉', T('……一個很悲傷的影子。如果薇絲珀在這裡，也許能救她。', '...Such a sad shadow. If Vesper were here, perhaps she could have saved it.'));
});
def('griefFight', async (c, group) => {
  await c.say(null, T('塔頂的機器在哭。它的齒輪每轉一圈，就有一段回憶被吸進去。', 'The machine atop the tower weeps. With every turn of its gears, another memory is drawn in.'));
  if (has('vesper')) await c.say('薇絲珀', T('我造了你，也由我來結束你。', 'I made you. I will end you.'));
  await c.hint(T('它會一直改變弱點。注意頭上的字。', 'It keeps changing its weakness. Watch the words above it.'));
  const r = await c.fight(group);
  if (r !== 'win') return;
  c.set('beat_grief'); c.set('ember_dawn'); c.set('heart_open');
  c.sfx('chime'); c.flash('#ffd0a0', 0.8); await c.wait(40);
  await c.say(null, T('機器停了。紅色的天空裂開一道縫，透出一點點橘色的光。', 'The machine stops. The red sky cracks, letting through a little orange light.'));
  await c.give('hourkey3');
  await c.say('蓮', T('三把鑰匙都到齊了。回時隙之間！', 'All three keys. Back to the Hour Between!'));
});

// ======================= Ren's episode: the first bell =======================
const orrinBase = SCRIPTS.orrin;
def('orrin', async (c) => {
  if (c.flag('interval_open') && c.flag('beat_vesper') && !c.flag('ep_ren')) {
    if (!c.flag('ren_quest')) {
      c.set('ren_quest');
      await c.say('奧林師傅', T('蓮，你跑過那麼多時代，也該做一口自己的鐘了。', "Ren, you've run through so many ages. It's time you made a bell of your own."));
      await c.say('奧林師傅', T('帶三樣東西回來：黃銅港的齒輪、冰河時代的霜晶、未來的餘燼核心。一口鐘，要有三個時代的聲音。', "Bring me three things: a Brasshaven gear, a frost crystal from the age of ice, and an ember core from the far future. A bell needs the sounds of three ages."));
      return;
    }
    if (count('brassgear') && count('frostcrystal') && count('embercore')) {
      addItem('brassgear', -1); addItem('frostcrystal', -1); addItem('embercore', -1);
      await c.say('奧林師傅', T('都帶回來了！好，這次你自己來。我只看著。', 'You brought them all! Good. This time you do it yourself. I will only watch.'));
      await c.fade(); c.sfx('chime'); await c.wait(50); c.sfx('toll'); await c.wait(40); await c.fadeIn();
      await c.say('奧林師傅', T('……好聲音。不是我的聲音，是你的。', "...A fine voice. Not mine. Yours."));
      await c.say('蓮', T('師傅，謝謝您。', 'Thank you, Master.'));
      c.set('ep_ren'); await c.give('renbell');
      return c.notice(T('蓮學會了「心之鐘」！', 'Ren learned Heart Bell!'));
    }
    return c.say('奧林師傅', T('黃銅齒輪、霜晶、餘燼核心，各一個。怪物身上或店裡都找得到。', 'One Brass Gear, one Frost Crystal, one Ember Core. Monsters carry them; shops sell some.'));
  }
  return orrinBase(c);
});

// ======================= paradoxes: what you change in the past changes the future =======================
const grandmaBase = SCRIPTS.grandma;
def('grandma', async (c) => {
  if (c.flag('interval_open') && !c.flag('got_acorn')) {
    c.set('got_acorn');
    await c.say('老祖母', T('你們又來了。這顆橡實是我祖母的祖母留下的，說它會長成一棵「記得時間的樹」。', "Back again. This acorn came from my grandmother's grandmother. She said it grows into a tree that remembers time."));
    await c.say('老祖母', T('種在你們掉下來的那個洞旁邊吧。也許它能替你們記住這裡。', "Plant it by the hole you fell through. Perhaps it will remember this place for you."));
    return c.give('acorn');
  }
  return grandmaBase(c);
});
def('plantAcorn', async (c) => {
  if (!count('acorn')) return c.say(null, T('鬆軟的黑土。很適合種東西。', 'Soft black earth. Good for planting.'));
  if (await c.ask(null, T('把古橡實種在這裡嗎？', 'Plant the Ancient Acorn here?'), [T('種下', 'Plant it'), T('不要', 'Not yet')]) !== 0) return;
  addItem('acorn', -1); c.set('acorn_planted'); c.sfx('heal');
  await c.say(null, T('小小的芽冒了出來。它會在這裡站好幾千年。', 'A tiny shoot pushes up. It will stand here for thousands of years.'));
  if (has('silas')) await c.say('賽勒斯', T('……我好像記得，靜止之年的廣場旁邊有一棵大樹。以前有嗎？', "...I seem to remember a huge tree by the square in Stillfall. Was it always there?"));
});
def('dryad', async (c) => {
  if (!c.flag('dryad_gift')) {
    c.set('dryad_gift');
    await c.say('樹靈', T('我是這棵橡樹的心。五千年前，一位老祖母和幾個從天上掉下來的孩子種下了我。', 'I am the heart of this oak. Five thousand years ago a grandmother and some children who fell from the sky planted me.'));
    await c.say('樹靈', T('靜止降臨的時候，我用根把時間留住了一小塊，讓大家躲在樹下。謝謝你們。', 'When the Stillness came, my roots held on to a little time, and people sheltered beneath me. Thank you.'));
    await c.give('regenring');
  }
  await c.say('樹靈', T('樹上結的果子和露水，可以分一些給你們。', 'I can share some of the fruit and dew from my branches.'));
  return c.shop('dryad');
});
def('springSurvivor', async (c) => {
  if (!c.flag('spring_gift')) { c.set('spring_gift'); await c.say('倖存者', T('乾了四百年的河道，突然湧出了水！聽說是黃銅港有人打開了水閘……那可是好幾百年前的事。', 'A riverbed dry for four hundred years suddenly ran with water! They say someone in Brasshaven opened a floodgate... centuries ago.')); return c.give('hiether', 3); }
  return c.say('倖存者', T('有水，就能種東西了。靜止之年……也許該換個名字了。', 'With water we can grow things. Stillfall... might need a new name.'));
});
def('greyfangCamp', async (c) => {
  if (c.flag('greyfang_debt')) return c.say('灰牙', T('我在當商隊的護衛了。誠實的工作……挺累的，但睡得好。', "I guard caravans now. Honest work... tiring, but I sleep well."));
  await c.say('灰牙', T('是你啊，小鬼。……那個女人的錢，我一毛都沒花。拿著吧。', "Oh, it's you, brat. ...I never spent a penny of that woman's money. Take it."));
  if (await c.ask('灰牙', T('你說，像我這樣的盜賊，還能重新來過嗎？', 'Tell me. Can a bandit like me start over?'), [T('當然可以', 'Of course'), T('很難吧', 'Hard to say')]) === 0) {
    await c.say('蓮', T('當然可以。時間會一直往前走，你也可以。', 'Of course. Time keeps moving forward, and so can you.'));
    await c.say('灰牙', T('……哼。那我就試試看吧。', '...Hmph. Then I suppose I will try.'));
    c.set('greyfang_debt'); S.gold += 300; return c.notice(T('得到 300 金幣。', 'Got 300 gold.'));
  }
  return c.say('灰牙', T('……是啊。', '...Yeah.'));
});
def('mammothHerd', async (c) => c.say(null, T('一群長毛猛獁悠閒地吃著草。帶頭的那隻額頭上有一圈圓圓的白毛。', 'A herd of woolly mammoths grazes peacefully. The leader has a round patch of white fur on its brow.')));
def('mammothRider', async (c) => {
  if (!c.flag('rider_gift')) { c.set('rider_gift'); await c.say('族裡的女人', T('我們的祖先說，很久很久以前有個少年救了一隻小猛獁，牠的子孫就一直跟我們做朋友。這件皮甲送你們。', 'Our ancestors say long, long ago a boy saved a mammoth calf, and its children have been our friends ever since. Take this hide armour.')); return c.give('mammothhide'); }
  return c.say('族裡的女人', T('騎猛獁去打獵，最快了！', 'Hunting on mammoth-back is the fastest way!'));
});

// ======================= the Heart of the Hush =======================
def('heartBack', async (c) => { if (await c.ask(null, T('回到時隙之間？', 'Return to the Hour Between?'), [T('回去', 'Return'), T('留下', 'Stay')]) === 0) await c.warp('interval', 16.5, 4.6, 'd'); });
def('heartBack2', async (c) => { if (await c.ask(null, T('回到回聲之路？', 'Back to the Road of Echoes?'), [T('回去', 'Return'), T('留下', 'Stay')]) === 0) await c.warp('heart1', 12, 3.6, 'd'); });
def('heartOn', async (c) => c.warp('heart2', 15.5, 26.4, 'u'));
def('echoFight', async (c, group) => {
  await c.say(null, T('打倒過的敵人，以寂靜的形狀站了起來。', 'A foe you once beat rises again in the shape of the Hush.'));
  const r = await c.fight(group);
  if (r !== 'win') return;
  c.set('beat_' + group.id);
});
def('choirFight', async (c, group) => {
  await c.say(null, T('無數沒有聲音的嘴一起張開——那是被寂靜吃掉的所有時間在唱歌。', 'Countless soundless mouths open at once: all the time the Hush has eaten, singing.'));
  const r = await c.fight(group);
  if (r !== 'win') return;
  c.set('beat_choir');
  await c.say('蓮', T('前面就是心臟了。', 'The heart is just ahead.'));
});
def('finalFight', async (c, group) => {
  await c.say(null, T('房間中央，一顆黑色的星星在跳動。一具巨大的身體從它的影子裡站了起來。', 'In the middle of the room a black star beats. A vast body stands up out of its shadow.'));
  const r = await c.fight(group);
  if (r !== 'win') return;
  c.music(null); await c.wait(30);
  await c.say('寂靜', T('……為什麼？', '...Why?'));
  await c.say('米拉', T('它……說話了？', 'It... spoke?'));
  await c.say('寂靜', T('我只是想讓所有的東西都不要失去。那個男人怕晚到，那個女人怕告別，那些族人怕冬天。我給了他們不會結束的一刻。', 'I only wanted nothing to be lost. That man feared being late, that woman feared goodbyes, those people feared winter. I gave them a moment that never ends.'));
  await c.say('寂靜', T('你也一樣，小鐘匠。留下來吧。在這裡，你的師傅不會老，你的朋友不會回到各自的時代。永遠的正午。', 'You too, little bellmaker. Stay. Here your master never grows old, and your friends never go back to their own ages. An eternal noon.'));
  const k = await c.ask('寂靜', T('留在永遠的正午嗎？', 'Stay in the eternal noon?'), [T('不。時間要往前走。', 'No. Time must move on.'), T('……好。', '...Yes.')]);
  if (k === 1) return c.ending('bad');
  await c.say('蓮', T('不。師傅會老，朋友會離開，花會謝。可是因為這樣，我們才會好好地說「再見」，然後說「早安」。', "No. Master will grow old, friends will leave, flowers will fall. But that's why we say 'goodbye' properly, and then 'good morning'."));
  if (has('vesper')) await c.say('薇絲珀', T('我也曾經想要那一刻。但我現在知道了：結束，是我們給彼此的禮物。', 'I once wanted that moment too. Now I know: endings are a gift we give each other.'));
  await c.say('寂靜', T('那麼……讓我聽聽，你們的鐘聲。', 'Then... let me hear your bell.'));
  c.heal(); c.sfx('heal'); await c.say(null, T('不知道從哪裡傳來了熟悉的鐘聲，大家的傷都好了。', "From somewhere comes a familiar bell, and everyone's wounds are healed."));
  const r2 = await c.battle(['unborn'], 15.5, 11.4, { boss: true });
  if (r2 !== 'win') return;
  c.set('beat_unborn');
  await c.say(null, T('黑色的星星裂開了。裡面不是黑暗，而是一顆很小、很小的種子，正在發芽。', 'The black star splits. Inside is not darkness but a tiny, tiny seed, sprouting.'));
  await c.say('寂靜', T('……原來，結束之後……是這種聲音。', '...So after an ending... comes this sound.'));
  const good = has('vesper') && c.flag('ep_vesper') && paradoxCount() >= 2;
  return c.ending(good ? 'good' : 'normal');
});

// ======================= after the end: the Unrung Bell =======================
def('eternalFight', async (c, group) => {
  await c.say('？？？', T('你來了，另一個我。', 'You came, other me.'));
  await c.say('蓮', T('……我？', '...Me?'));
  await c.say('永恆的蓮', T('我是在寂靜之心說了「好」的蓮。我留在正午，一千年、一萬年……這口沒響過的鐘，就是我。', "I am the Ren who said 'yes' in the Heart of the Hush. I stayed in the noon, a thousand years, ten thousand... This bell that never rang is me."));
  await c.say('永恆的蓮', T('讓我看看，選擇往前走的你，到底得到了什麼。', 'Show me what you, who chose to move on, really gained.'));
  const r = await c.fight(group);
  if (r !== 'win') return;
  c.set('beat_eternal');
  c.sfx('toll'); c.flash('#fff4c0', 0.9); await c.wait(60);
  await c.say('永恆的蓮', T('……鐘響了。原來，我一直在等這一聲。', '...The bell rang. So this is the sound I was waiting for.'));
  await c.say('永恆的蓮', T('謝謝。去吧，替我好好地變老。', 'Thank you. Go on. Grow old properly, for me.'));
  await c.say(null, T('未鳴之鐘第一次響了。那聲音傳過所有的時代，最後在燈河鎮的工坊裡，讓一個老鐘匠微微地笑了。', 'The Unrung Bell rang for the first time. The sound passed through every age, and at last, in a workshop in Lanternford, it made an old clockmaker smile.'));
  await c.give('unrungkey');
});

export { has };
