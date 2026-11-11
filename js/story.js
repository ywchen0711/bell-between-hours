// The story, written as plain async scripts. Every line is in both languages: T('中文', 'English').
import { L } from './i18n.js';
import { S, addItem, member, fullHeal } from './party.js';
import { ITEMS, SHOPS } from './data.js';

const T = (zh, en) => L(zh, en);
export const SCRIPTS = {};
const def = (name, f) => { SCRIPTS[name] = f; };

// ======================= the present =======================
def('intro', async (c) => {
  await c.caption([T('公元 1250 年', 'AD 1250'), T('鐘匠之都・燈河鎮', 'Lanternford, the town of clockmakers')]);
  await c.fadeIn();
  await c.say('奧林師傅', T('蓮！還在發呆？明天就是千鐘祭了，女王要親手敲響我們做的「時之鐘」。', "Ren! Daydreaming again? Tomorrow is the Thousand Bells Festival, and the Queen herself will ring the Hour Bell we made."));
  await c.say('蓮', T('我知道啦，師傅。鐘心那塊黑色的金屬，到現在摸起來還是冰的。', "I know, Master. That black metal in the bell's heart is still cold to the touch."));
  await c.say('奧林師傅', T('那是一個穿斗篷的旅人賣給我的星鐵。聲音好得不得了……只是還沒調音。', "Star-iron, sold to me by a cloaked traveller. A wonderful voice... but it isn't tuned yet."));
  await c.say('奧林師傅', T('問題是，昨晚有盜賊闖進來，把我調鐘的音叉偷走了！聽說他們躲在東邊的燈河之森。', "Trouble is, bandits broke in last night and stole my tuning fork! They say they hide in Lantern Woods, east of town."));
  await c.say('奧林師傅', T('你去把音叉拿回來。帶著這把木劍……小心點，森林裡的怪物看得見，你也躲得開。', "Go and get it back. Take this practice sword... and be careful. You can see the monsters in the woods, so you can steer round them too."));
  await c.hint(T('地圖上看得到的怪物，走過去碰到就會在原地開戰。按住 B 可以跑。', "Monsters walk the map where you can see them. Walk into one and the fight starts right there. Hold B to run."));
  c.set('met_orrin');
});
def('orrin', async (c) => {
  if (c.flag('present_frozen') && !c.flag('clapper_made')) return SCRIPTS.orrinForge(c);
  if (c.flag('beat_vesper')) return c.say('奧林師傅', T('鐘聲好聽極了。不管你要去哪個時代，都要回來喝杯茶，蓮。', 'The bell sounds wonderful. Whatever age you go to next, come back for tea, Ren.'));
  if (c.flag('clapper_made')) return c.say('奧林師傅', T('三時之舌在你手上。去鐘塔吧，鐘在等你。', 'The Three-Hour Clapper is yours. Go to the tower; the bell is waiting.'));
  if (c.flag('beat_greyfang') && !c.flag('fork_back')) {
    await c.say('奧林師傅', T('這是……我的音叉！你真的拿回來了！', "That's... my fork! You really got it back!"));
    await c.say('米拉', T('盜賊說，是一個戴兜帽的人雇他們偷的。那人說：「這口鐘絕對不能調音。」', 'The bandits said a hooded figure paid them to steal it. They said, "That bell must never be tuned."'));
    await c.say('奧林師傅', T('奇怪的話……不過沒時間了，我連夜調音。你們去廣場吧，女王快到了。', "Strange words... but there's no time. I'll tune it tonight. Go on to the square; the Queen will be here soon."));
    c.set('fork_back');
    await c.fade(); await c.wait(20); await c.fadeIn();
    return c.say('奧林師傅', T('（打了個大呵欠）……調好了。快去，女王在廣場等著。', '(a huge yawn) ...Tuned. Go on, the Queen is waiting in the square.'));
  }
  if (c.flag('met_orrin')) return c.say('奧林師傅', T('音叉在東邊的燈河之森。出了鎮子往右走。', 'The fork is in Lantern Woods, east of town. Head right out of the square.'));
  return SCRIPTS.intro(c);
});
def('readShelf', async (c) => c.say(null, T('《鐘的語言》：好的鐘有三種聲音——開始的聲音、現在的聲音、結束的聲音。', '"The Language of Bells": a good bell has three voices: the sound of beginning, the sound of now, and the sound of ending.')));
def('miraPlaza', async (c) => {
  await c.say('米拉', T('……這口鐘的聲音，用的是一個不存在的音。', "...this bell hums in a note that doesn't exist."));
  await c.say('蓮', T('你是誰？你聽得到鐘在響？它還沒敲啊。', "Who are you? You can hear the bell? Nobody's rung it yet."));
  await c.say('米拉', T('我叫米拉，研究「時間」的學者。這塊星鐵在吸東西……吸的是時間。', "I'm Mira, a scholar of time. That star-iron is drinking something in... it's drinking time."));
  await c.say('米拉', T('你要去找偷音叉的盜賊？我跟你去。我想知道是誰賣了這塊鐵。', "You're after the bandits who took the fork? I'll come with you. I want to know who sold this metal."));
  c.join('mira');
  await c.notice(T('米拉加入了隊伍！', 'Mira joined the party!'));
  await c.hint(T('兩個人的氣槽都滿的時候，「技」裡會出現合體技（★）。', 'When two friends both have full gauges, combined techniques (★) appear under Tech.'));
});
def('queen', async (c) => {
  await c.say('女王', T('你就是奧林師傅的徒弟？多虧你，鐘調好了。來吧，一起聽第一聲鐘響。', "You are Master Orrin's apprentice? Thanks to you the bell is tuned. Come, let us hear its first toll together."));
  await c.fade(); c.music(null); await c.wait(20);
  c.camera(20.5, 9); await c.fadeIn();
  await c.say(null, T('正午。女王拉下鐘繩——', 'Noon. The Queen pulls the bell rope...'));
  c.sfx('toll'); c.flash('#ffffff', 0.8); await c.wait(70);
  c.sfx('toll'); c.flash('#c0b0ff', 0.6); c.shake(30); await c.wait(70);
  await c.say('米拉', T('不對……聲音不是往外傳，是往裡吸！', "Wrong... the sound isn't going out, it's being pulled in!"));
  c.set('bell_rung'); c.set('present_frozen'); c.set('rift_lantern');
  c.sfx('rift'); c.flash('#6040a0', 0.9); await c.wait(40);
  await c.say('？？？', T('第一聲。睡吧，燈河鎮。在寂靜裡，什麼都不會再結束。', 'The first toll. Sleep, Lanternford. In the silence, nothing ever ends again.'));
  await c.say('蓮', T('大家……都不動了？！米拉，地上那是什麼——', "Everyone... stopped moving?! Mira, what's that on the ground..."));
  c.sfx('rift'); c.flash('#ffffff', 1); c.shake(40); await c.wait(30);
  await c.fade();
  c.camera(null);
  await c.warp('stillfall', 20.5, 18.4, 'd', true);
});
def('kid', async (c) => c.flag('present_frozen') && !c.flag('present_frozen_done') ? c.frozen() : c.say('小孩', T('千鐘祭的時候，全鎮的鐘會一起響喔！一千個鐘！', 'At the festival every clock in town rings together! A thousand bells!')));
def('townman', async (c) => c.flag('present_frozen') && !c.flag('present_frozen_done') ? c.frozen() : c.say('鎮民', c.flag('beat_vesper') ? T('我好像做了一個很長的夢，夢裡一直是正午。', 'I think I had a long dream. It was noon the whole time.') : T('燈河鎮的鐘匠做的錶，連王都的人都搶著買。', "Lanternford watches are the envy of the capital.")));
def('townwoman', async (c) => c.flag('present_frozen') && !c.flag('present_frozen_done') ? c.frozen() : c.say('鎮民', T('那口新鐘的聲音呀，聽說能傳到一千年以後呢。', 'They say the new bell can be heard a thousand years from now.')));
def('guardTower', async (c) => c.say('守衛', c.flag('fork_back') ? T('女王就在廣場上，去見她吧。', 'Her Majesty is in the square. Go and see her.') : T('祭典前，鐘塔不准進去。', 'No one goes up the tower before the festival.')));
def('guardGate', async (c) => c.say('守衛', T('東邊是燈河之森。最近盜賊很多，自己小心。', 'East is Lantern Woods. Plenty of bandits lately; take care.')));
def('woodsGuard', async (c) => c.say('守衛', c.flag('beat_greyfang') ? T('你打贏了灰牙？了不起！', 'You beat Greyfang? Remarkable!') : T('盜賊的頭目是一個狼人，叫灰牙。他們的營地在森林的東北邊。', 'The bandit chief is a wolf-man called Greyfang. Their camp is in the north-east of the woods.')));
def('greyfangIntro', async (c, group) => {
  await c.say('灰牙', T('嗚……鐘匠的小鬼來要音叉了？那個戴兜帽的女人出的錢可不少。', "Grr... the clockmaker's brat has come for the fork? The hooded woman paid well for it."));
  await c.say('灰牙', T('她說，那口鐘絕對不能調音。所以——你們回不去了！', "She said that bell must never be tuned. So... you won't be going home!"));
  const r = await c.fight(group);
  if (r !== 'win') return;
  c.set('beat_greyfang');
  await c.say('灰牙', T('嗚……拿去，拿去！那女人的名字……好像叫薇絲珀……', 'Grr... take it, take it! The woman\'s name... Vesper, I think...'));
  c.give('fork');
  await c.say('米拉', T('薇絲珀……賣星鐵給師傅的，大概也是她。回鎮上吧。', 'Vesper... probably the one who sold the star-iron, too. Back to town.'));
});
def('frozenPerson', async (c) => c.say(null, T('一動也不動。皮膚冰冷，像石頭一樣。', 'Not moving at all. Cold to the touch, like stone.')));
def('shopLantern', async (c) => c.flag('present_frozen') && !c.flag('present_frozen_done') ? c.frozen() : c.shop(c.flag('beat_vesper') ? 'lantern2' : 'lantern'));
def('inn', async (c) => c.flag('present_frozen') && !c.flag('present_frozen_done') ? c.frozen() : c.inn(30));

// ======================= Stillfall =======================
def('arriveFuture', async (c) => {
  c.set('arrived_future_talk'); c.set('arrived_future');
  await c.caption([T('公元 2400 年', 'AD 2400'), T('靜止之年', 'Stillfall')]);
  c.music('ruins');
  await c.say('蓮', T('這裡……是燈河鎮？鐘塔還在，可是房子全倒了。', "This is... Lanternford? The tower's still here, but the houses have all fallen."));
  await c.say('米拉', T('看那些石像。那個賣東西的大叔、那個小孩……全是剛才廣場上的人。', 'Look at the statues. The merchant, the little boy... they\'re the people from the square.'));
  await c.say('米拉', T('他們沒有變成石頭。他們只是……停在那一刻，停了一千多年。', "They didn't turn to stone. They just... stopped in that moment. For over a thousand years."));
});
def('silasMeet', async (c) => {
  if (!c.flag('has_silas')) return c.say('賽勒斯', T('別過來！這裡有幽影——', "Stay back! There are shades here..."));
  return null;
});
def('silasFight', async (c, group) => {
  await c.say('賽勒斯', T('喂！你們是活的？那就快幫忙！這些幽影會把人的時間吸乾！', "Hey! You're alive? Then help! These shades suck the time out of people!"));
  const r = await c.fight(group);
  if (r !== 'win') return;
  await c.say('賽勒斯', T('……你們會動。好久沒看到會動的人了。我叫賽勒斯，在廢墟裡撿東西過活。', "...You move. I haven't seen anyone move in ages. I'm Silas. I scavenge the ruins."));
  await c.say('蓮', T('這裡發生了什麼事？', 'What happened here?'));
  await c.say('賽勒斯', T('「靜止」。一千一百五十年前，鐘塔的鐘第一次響。從那以後，它每個時辰都會無聲地響一次，每響一次，世界就停得更多。', '"The Stillness." The tower bell first rang eleven hundred and fifty years ago. Ever since, it tolls soundlessly every hour, and each toll stops more of the world.'));
  await c.say('賽勒斯', T('我還能動，是因為奶奶留給我的這個懷錶。它的心一直在跳。', "I can still move because of this pocketwatch my grandmother left me. Its heart keeps beating."));
  await c.say('賽勒斯', T('想知道更多，去鎮東北的檔案館找伊歐妮。……算了，我帶你們去。', "If you want to know more, see Ione at the Archive in the north-east of town. ...Never mind, I'll take you."));
  c.join('silas');
  await c.notice(T('賽勒斯加入了隊伍！', 'Silas joined the party!'));
  if (S.active.length >= 3) await c.hint(T('同時最多三人出戰。可以在選單的「隊伍」裡換人。', 'Up to three can fight at once. Swap people under Party in the menu.'));
});
def('survivor', async (c) => c.say('倖存者', c.flag('spire_cleared') ? T('風……有風了。你聽，葉子在動。', 'Wind... there\'s wind again. Listen, the leaves are moving.') : c.flag('spire_open') ? T('廣場上那道紅色的裂縫，通往一座從天上長下來的塔。', 'That red crack in the square leads to a tower that grew down out of the sky.') : T('我躲在檔案館的「慢時間」裡才撐到現在。外面的人一個一個都停了。', "I only lasted this long hiding in the Archive's slow time. Out here, people stopped one by one.")));
def('shopStillfall', async (c) => { await c.say(null, T('自動販賣機還在動。投進金幣——', 'The vending machine still works. In go the coins...')); return c.shop('stillfall'); });
def('ione', async (c) => {
  if (c.flag('beat_warden')) return c.say('伊歐妮', T('機器已經對準星星落下的地方。三千年前……去吧。', 'The machine is aimed where the star fell. Three thousand years ago... go.'));
  if (c.flag('met_ione')) return c.say('伊歐妮', T('看守者就在機器前面。它曾經保護這裡，現在只聽寂靜的話了。', 'The Warden stands before the machine. It used to guard us. Now it obeys only the Hush.'));
  await c.say('伊歐妮', T('……訪客？還是從過去來的。我是伊歐妮，這座「時之檔案館」最後的館員。', '...Visitors? From the past, no less. I am Ione, the last keeper of the Hour Archive.'));
  await c.say('伊歐妮', T('那口鐘的鐘心，是「寂靜」的種子。三千年前它像星星一樣落進根野的火山口，靠吃「時間的流動」活著。', "The bell's heart is a seed of the Hush. Three thousand years ago it fell like a star into a crater in the Rootwild. It lives by eating the passing of time."));
  await c.say('伊歐妮', T('你們的鐘把它叫醒了。它想讓一切停在同一刻，永遠不會結束——也永遠不會開始。', 'Your bell woke it. It wants everything stopped in one moment: nothing ever ending, and nothing ever beginning.'));
  await c.say('米拉', T('那要怎麼辦？', 'Then what can we do?'));
  await c.say('伊歐妮', T('裡面的時隙機，能打開通往種子落下之處的門。可是看守者擋在那裡。', 'The rift machine inside can open a door to where the seed fell. But the Warden stands in the way.'));
  c.set('met_ione');
});
def('wardenBlock', async (c) => { await c.say(null, T('裡面有東西在動。先跟館員談談吧。', 'Something moves in there. Talk to the keeper first.')); c.push(0, 18); });
def('wardenIntro', async (c, group) => {
  await c.say('看守者', T('……入侵者。依寂靜之令，停止。', '...Intruders. By order of the Hush: stop.'));
  const r = await c.fight(group);
  if (r !== 'win') return;
  c.set('beat_warden'); c.sfx('rift');
  await c.say('伊歐妮', T('時隙機啟動了！那道門通往公元前三千年。', 'The rift machine is running! That door leads to three thousand years before your time.'));
  await c.say('賽勒斯', T('三千年前……那時候連燈河鎮都還沒有吧。', "Three thousand years... Lanternford didn't even exist then."));
});

// ======================= the Rootwild =======================
def('arriveAncient', async (c) => {
  c.set('arrived_ancient');
  await c.caption([T('公元前 3000 年', '3000 BC'), T('根野', 'The Rootwild')]);
  await c.say('賽勒斯', T('好綠……我從來沒看過會長大的東西。', "So green... I've never seen things that grow."));
  await c.say('米拉', T('東邊有炊煙，大概是村子。星星落下的地方，問當地人最清楚。', "There's smoke to the east, a village maybe. The locals will know where the star fell."));
});
def('chief', async (c) => {
  if (c.flag('beat_stonehorn')) return c.say('族長', T('我被天上來的女人騙了。那顆石頭唱的不是力量，是飢餓。', 'I was fooled by the woman from the sky. The stone does not sing of power. It sings of hunger.'));
  await c.say('族長', T('我是族長托朗。天上的使者告訴我，火山口裡會唱歌的星石，能讓我們的部族永遠不老、不死。', 'I am Chief Toran. A messenger from the sky told me the singing star-stone in the crater will make our tribe never age, never die.'));
  await c.say('族長', T('我的戰士正在挖它。誰也不准阻止。', 'My warriors are digging it out. No one will stop them.'));
});
def('grandma', async (c) => {
  if (c.flag('has_kaya') && !c.flag('got_flute')) {
    await c.say('老祖母', T('卡雅跟你們走了？那就帶上這個。骨笛吹的是「開始的聲音」——每天早上，我們用它叫醒太陽。', 'Kaya is going with you? Then take this. The bone flute plays the sound of beginning. Every morning we use it to wake the sun.'));
    c.give('flute'); c.set('got_flute'); return;
  }
  return c.say('老祖母', T('星石唱的歌，我年輕時聽過一次。唱完以後，整片森林的鳥都忘了怎麼飛。', 'I heard the star-stone sing once, when I was young. Afterwards, every bird in the forest forgot how to fly.'));
});
def('kayaMeet', async (c) => {
  await c.say('卡雅', T('你們是從天上的洞掉下來的人？我看到了。', 'You\'re the ones who fell out of the hole in the sky? I saw.'));
  await c.say('卡雅', T('我叫卡雅，族長的女兒。父親被那個使者迷住了。那顆石頭不是寶物，它在吃東西——我晚上聽得到。', "I'm Kaya, the chief's daughter. My father's been bewitched by that messenger. The stone isn't a treasure. It eats. I can hear it at night."));
  await c.say('蓮', T('那個使者，是不是一個戴兜帽、拿鐮刀的女人？', 'This messenger: a hooded woman with a scythe?'));
  await c.say('卡雅', T('就是她！你們要去火山口？我帶路。守路的人會讓我過去。', "That's her! You're going to the crater? I'll lead. The guards will let me pass."));
  c.join('kaya');
  await c.notice(T('卡雅加入了隊伍！', 'Kaya joined the party!'));
  await c.say('卡雅', T('先去跟奶奶說一聲。她住在村子西南邊的帳篷。', 'Let me tell Grandmother first. Her tent is in the south-west of the village.'));
});
def('tribem', async (c) => c.say('族人', T('火山口裡的牛頭巨人，是使者帶來的。牠的力氣能推倒一棵樹。', 'The bull-headed giant in the crater came with the messenger. It can push over a tree.')));
def('shopVillage', async (c) => { await c.say('族裡的女人', T('用你們的亮晶晶的金屬換東西？好啊。', 'Trade your shiny metal? Sure.')); return c.shop('village'); });
def('craterGuard', async (c) => c.say('族人', T('火山口是聖地，外人不准進去。', 'The crater is sacred. No outsiders.')));
def('craterBlocked', async (c) => { await c.say('族人', T('站住！外人不准去火山口。', 'Halt! No outsiders to the crater.')); c.push(0, 20); });
def('stonehornIntro', async (c, group) => {
  await c.say('薇絲珀', T('又是你們。從燈河鎮一路追到三千年前……真執著。', "You again. All the way from Lanternford to three thousand years ago... how persistent."));
  await c.say('薇絲珀', T('我是薇絲珀，鑄鐘人。我來自你們看到的那個未來之後更久的未來——一個什麼都會結束的世界。', "I am Vesper, the Bellwright. I come from long after the future you saw: a world where everything ends."));
  await c.say('薇絲珀', T('我失去的人，再也回不來。所以我要讓時間停下。沒有結束，就沒有失去。', "The ones I lost will never come back. So I will stop time. With no endings, there is no loss."));
  await c.say('卡雅', T('沒有結束，也就沒有明天！', 'With no endings there is no tomorrow either!'));
  await c.say('薇絲珀', T('石角，讓他們安靜。', 'Stonehorn. Quiet them.'));
  const r = await c.fight(group);
  if (r !== 'win') return;
  c.set('beat_stonehorn'); c.set('can_return_present');
  await c.say('薇絲珀', T('……沒關係。種子的一半，已經在你們的時代的鐘裡了。在鐘塔頂上等你們。', '...No matter. Half the seed already sleeps in the bell of your time. I will wait for you atop the tower.'));
  c.sfx('rift'); c.flash('#6040a0', 0.7); await c.wait(30);
  await c.say('米拉', T('種子不能毀掉，可是能「調音」。開始的聲音、現在的聲音、結束的聲音——用三個時代的聲音做一根鐘舌。', "The seed can't be destroyed, but it can be tuned. The sound of beginning, the sound of now, the sound of ending: a clapper made of three eras' sounds."));
  await c.say('卡雅', T('開始的聲音……奶奶的骨笛！', "The sound of beginning... Grandmother's bone flute!"));
  await c.say('賽勒斯', T('結束的聲音，是我的懷錶吧。它在一個快要結束的世界裡走了一輩子。', "The sound of ending must be my pocketwatch. It's ticked its whole life in a world that's ending."));
  await c.say('蓮', T('現在的聲音，是師傅的音叉。回燈河鎮！', "And the sound of now is the Master's tuning fork. Back to Lanternford!"));
  if (!c.flag('got_flute')) { await c.say('卡雅', T('我先跑回村子拿笛子。……拿到了！', "I'll run back to the village for the flute... got it!")); c.give('flute'); c.set('got_flute'); }
});

// ======================= the present, stilled =======================
def('orrinForge', async (c) => {
  await c.say('奧林師傅', T('蓮！你回來了！外面的人全停住了，只有這間工坊——大概是因為這裡的鐘我每一個都上了發條，它們一直在走。', "Ren! You're back! Everyone outside has stopped. Only this workshop... I think because I wind every clock in here, and they never stop ticking."));
  await c.say('蓮', T('師傅，我們需要做一根鐘舌。用音叉、骨笛，還有……', 'Master, we need to make a clapper. From the fork, the bone flute, and...'));
  await c.say('賽勒斯', T('……還有這個懷錶。', '...and this pocketwatch.'));
  await c.say('奧林師傅', T('這是你保命的東西吧？', "Isn't that what keeps you moving?"));
  await c.say('賽勒斯', T('在我的時代是。可是如果大家都能動了，我就不需要它了。', 'In my time, yes. But if everyone can move again, I won\'t need it.'));
  await c.fade(); c.sfx('chime'); await c.wait(80); await c.fadeIn();
  addItem('fork', -1); addItem('flute', -1);
  c.give('clapper'); c.set('clapper_made');
  await c.say('奧林師傅', T('三時之舌，做好了。還有這個——鐘心剩下的星鐵，我打成了一把劍。', 'The Three-Hour Clapper is done. And this: I forged the leftover star-iron into a sword.'));
  c.give('starblade');
  await c.say('奧林師傅', T('去鐘塔吧。這次，讓它發出真正的聲音。', 'Go to the tower. This time, let it ring true.'));
});
def('bellTouch', async (c) => c.say(null, c.flag('beat_vesper') ? T('鐘輕輕地晃著，發出溫暖的嗡嗡聲。', 'The bell sways gently, humming warmly.') : c.flag('bell_rung') ? T('鐘心發出紫色的光，冷得刺骨。', "The bell's heart glows violet, cold to the bone.") : T('巨大的時之鐘。鐘心是黑色的星鐵。', 'The great Hour Bell. Its heart is black star-iron.')));
def('vesperTower', async (c) => {
  c.set('vesper_met_tower');
  await c.say('薇絲珀', T('你們來了。看看這個鎮子——不會再有人老去，不會再有人離開。這不是很美嗎？', 'You came. Look at this town: no one will grow old, no one will ever leave. Isn\'t it beautiful?'));
  await c.say('蓮', T('他們也不會笑、不會長大。那不是活著！', "They won't laugh or grow up either. That isn't living!"));
  await c.say('薇絲珀', T('那就跟他們一起停下吧。', 'Then stop with them.'));
  const r = await c.battle(['vesper'], 7.5, 6, { boss: true });
  if (r !== 'win') return;
  c.set('beat_vesper');
  await c.say('薇絲珀', T('……我只是……不想再說再見。', "...I only... didn't want to say goodbye again."));
  await c.say('米拉', T('結束很痛。可是因為有結束，每一刻才那麼珍貴。', 'Endings hurt. But because things end, every moment matters.'));
  await c.say(null, T('蓮把三時之舌掛上鐘。', 'Ren hangs the Three-Hour Clapper in the bell.'));
  c.sfx('chime'); c.flash('#fff4c0', 0.9); await c.wait(60);
  c.sfx('toll'); await c.wait(80);
  c.set('present_frozen_done');
  await c.say('蓮', T('聽！外面的人……在說話了！', "Listen! The people outside... they're talking!"));
  c.sfx('quake'); c.shake(50); c.flash('#a02040', 0.6); await c.wait(40);
  await c.say('伊歐妮', T('（聲音從鐘裡傳來）……聽得到嗎？未來的寂靜失去了種子，它整個醒過來了！一座塔從天上長進了靜止之年！', "(a voice from the bell) ...Can you hear me? The Hush in the future has lost its seed, and it has fully woken! A tower has grown down out of the sky into Stillfall!"));
  await c.say('薇絲珀', T('那是寂靜的本體……穿過鎮上的裂縫去吧。我……在這裡守著這個時代。', 'That is the Hush itself... Go through the rift in the square. I... will guard this age.'));
  c.set('spire_open');
  await c.hint(T('鎮上廣場的時隙可以前往各個時代。', 'The rift in the town square can take you to any era you have visited.'));
});

// ======================= the end =======================
def('spireGate', async (c) => { if (await c.ask(null, T('紅色的時隙通往寂靜之塔。要進去嗎？', 'The red rift leads to the Silent Spire. Go in?'), [T('進去', 'Go in'), T('等一下', 'Not yet')]) === 0) await c.warp('spire', 11.5, 41.2, 'u'); });
def('spireBack', async (c) => { if (await c.ask(null, T('回到靜止之年？', 'Return to Stillfall?'), [T('回去', 'Return'), T('留下', 'Stay')]) === 0) await c.warp('stillfall', 20.5, 26.8, 'd'); });
def('hushIntro', async (c, group) => {
  await c.say('寂靜', T('…………', '...........'));
  await c.say('米拉', T('它不會說話。它只是一個會吃時間的洞。', "It can't speak. It's just a hole that eats time."));
  await c.say('蓮', T('那就讓它聽聽，我們三個時代的聲音！', 'Then let it hear the sound of our three eras!'));
  const r = await c.fight(group);
  if (r !== 'win') return;
  c.set('beat_hush'); c.set('spire_cleared');
  await c.ending();
});

// era travel through any open rift
def('riftGate', async (c) => {
  const here = c.era();
  const opts = [];
  if (c.flag('can_return_present') && here !== 'present') opts.push(['present', T('公元 1250 年・燈河鎮', 'AD 1250 · Lanternford')]);
  if (c.flag('arrived_future') && here !== 'future' && (c.flag('can_return_present'))) opts.push(['future', T('公元 2400 年・靜止之年', 'AD 2400 · Stillfall')]);
  if (c.flag('beat_warden') && here !== 'ancient') opts.push(['ancient', T('公元前 3000 年・根野', '3000 BC · the Rootwild')]);
  if (!opts.length) return c.say(null, T('時隙在旋轉，可是還不知道它通往哪裡。', "The rift turns, but you don't yet know where it leads."));
  const k = await c.ask(null, T('時隙在旋轉。要去哪個時代？', 'The rift turns. Which era?'), [...opts.map((o) => o[1]), T('不去', 'Stay')]);
  if (k < 0 || k >= opts.length) return;
  c.sfx('rift');
  const to = opts[k][0];
  if (to === 'present') await c.warp('lantern', 20.5, 19.6, 'd');
  if (to === 'future') await c.warp('stillfall', 20.5, 18.6, 'd');
  if (to === 'ancient') await c.warp('rootwild', 4.5, 16.5, 'r');
});

export function shopList(id) { return SHOPS[id].filter((i) => ITEMS[i]); }
export { member, fullHeal };
