// Games for the Worldwide National Movement tab. A card in the sidebar (under "Translate
// anything") opens them in their own window, like the stock chart:
//   Trivia            10 timed questions, categories, a 50/50 lifeline and streak bonuses
//   Word puzzle       tap the letter tiles (or type) to unscramble a history word
//   Timeline          put four events in order, oldest first
//   Which came first? pick the earlier of two events; one wrong answer ends the run
// Points and best scores are saved in this browser. Uses escapeHtml() from app.js.

// ---- Questions and events ----

// [category, question, answer, three wrong answers, short fact shown afterwards]
const TRIVIA = [
  ["us", "In what year was the Declaration of Independence adopted?", "1776", ["1781", "1787", "1791"], "It was adopted by the Continental Congress on July 4, 1776."],
  ["us", "Who was the main author of the Declaration of Independence?", "Thomas Jefferson", ["John Adams", "Benjamin Franklin", "James Madison"], "Jefferson drafted it; Adams and Franklin suggested edits."],
  ["us", "How many amendments make up the Bill of Rights?", "10", ["5", "12", "27"], "The first ten amendments were ratified in 1791."],
  ["us", "Which amendment protects the right to keep and bear arms?", "The Second", ["The First", "The Fourth", "The Tenth"], "The Second Amendment was ratified in 1791 with the rest of the Bill of Rights."],
  ["us", "How many senators serve in the U.S. Senate?", "100", ["50", "435", "538"], "Each of the 50 states has two senators."],
  ["us", "Who was the first President of the United States?", "George Washington", ["John Adams", "Thomas Jefferson", "Alexander Hamilton"], "Washington served two terms, from 1789 to 1797."],
  ["us", "Hamilton and Madison wrote the Federalist Papers with which third author?", "John Jay", ["John Adams", "Patrick Henry", "Samuel Adams"], "The 85 essays urged New York to ratify the Constitution."],
  ["us", "Which president gave the Gettysburg Address?", "Abraham Lincoln", ["Ulysses S. Grant", "Andrew Johnson", "James Buchanan"], "Lincoln spoke at Gettysburg on November 19, 1863."],
  ["us", "In what year was the U.S. Constitution signed?", "1787", ["1776", "1783", "1791"], "It was signed in Philadelphia on September 17, 1787."],
  ["us", "Which president said “Mr. Gorbachev, tear down this wall!”?", "Ronald Reagan", ["George H. W. Bush", "Jimmy Carter", "John F. Kennedy"], "Reagan said it in West Berlin in 1987."],
  ["us", "How long is a term in the U.S. House of Representatives?", "2 years", ["4 years", "6 years", "1 year"], "Every House seat is up for election every two years."],
  ["us", "The Louisiana Purchase of 1803 was bought from which country?", "France", ["Spain", "Britain", "Mexico"], "Napoleon's France sold it for about $15 million."],
  ["us", "Which state was the first to ratify the Constitution?", "Delaware", ["Pennsylvania", "Virginia", "New Jersey"], "Delaware ratified on December 7, 1787, earning the nickname “The First State”."],
  ["us", "What is the minimum age to be President of the United States?", "35", ["30", "40", "25"], "Article II also requires being a natural-born citizen and 14 years' residency."],
  ["us", "Which document begins with the words “We the People”?", "The U.S. Constitution", ["The Declaration of Independence", "The Bill of Rights", "The Articles of Confederation"], "Its preamble starts “We the People of the United States…”"],
  ["us", "How many justices sit on the U.S. Supreme Court?", "9", ["7", "11", "12"], "The number has been nine since 1869."],
  ["us", "From which country did the United States buy Alaska in 1867?", "Russia", ["Canada", "Britain", "Spain"], "Secretary of State William Seward arranged the $7.2 million purchase."],
  ["us", "Who wrote the words of “The Star-Spangled Banner”?", "Francis Scott Key", ["Paul Revere", "Samuel Francis Smith", "John Philip Sousa"], "Key wrote the poem in 1814 after the bombardment of Fort McHenry."],
  ["us", "In what year did the Mayflower Pilgrims land at Plymouth?", "1620", ["1607", "1588", "1650"], "Jamestown, the first lasting English colony, came earlier, in 1607."],
  ["us", "The Liberty Bell is kept in which city?", "Philadelphia", ["Boston", "New York", "Washington, D.C."], "It hangs across from Independence Hall."],
  ["us", "Which president served the longest?", "Franklin D. Roosevelt", ["Ronald Reagan", "Thomas Jefferson", "Dwight D. Eisenhower"], "Roosevelt was elected four times and served from 1933 until his death in 1945."],
  ["us", "Which mountain has four presidents carved into it?", "Mount Rushmore", ["Stone Mountain", "Pikes Peak", "Mount Vernon"], "It shows Washington, Jefferson, Theodore Roosevelt and Lincoln."],
  ["us", "At which battle in 1781 did the British army under Cornwallis surrender?", "Yorktown", ["Saratoga", "Bunker Hill", "Trenton"], "The surrender at Yorktown, Virginia, effectively ended the fighting of the Revolutionary War."],
  ["us", "How many stars are on the U.S. flag?", "50", ["48", "13", "52"], "One for each state; the 50-star flag has flown since 1960."],
  ["uk", "In what year was Magna Carta sealed by King John?", "1215", ["1066", "1314", "1485"], "It was sealed at Runnymede in June 1215."],
  ["uk", "Who was the British prime minister for most of World War II?", "Winston Churchill", ["Neville Chamberlain", "Clement Attlee", "Anthony Eden"], "Churchill led the country from May 1940 to July 1945."],
  ["uk", "In what year did Margaret Thatcher first become prime minister?", "1979", ["1975", "1983", "1990"], "She was Britain's first woman prime minister and served until 1990."],
  ["uk", "Who commanded the allied army that defeated Napoleon at Waterloo?", "The Duke of Wellington", ["Lord Nelson", "The Duke of Marlborough", "General Gordon"], "Waterloo was fought in June 1815 in present-day Belgium."],
  ["uk", "In what year did the UK vote to leave the European Union?", "2016", ["2014", "2019", "2020"], "The referendum was held on June 23, 2016; the UK left in 2020."],
  ["uk", "What is the lower house of the UK Parliament called?", "The House of Commons", ["The House of Lords", "The Senate", "The Privy Council"], "The Commons has 650 elected members."],
  ["uk", "Who reigned over Britain for most of the 19th century?", "Queen Victoria", ["George III", "Edward VII", "William IV"], "Victoria reigned from 1837 to 1901."],
  ["uk", "Which 1805 sea battle secured Britain's naval supremacy?", "Trafalgar", ["Jutland", "The Nile", "Copenhagen"], "Admiral Nelson was killed in the moment of his victory."],
  ["uk", "What is the address of the British prime minister's London home and office?", "10 Downing Street", ["Buckingham Palace", "Kensington Palace", "Clarence House"], "Prime ministers have lived and worked there since Robert Walpole in 1735."],
  ["fr", "The storming of the Bastille took place in which year?", "1789", ["1776", "1799", "1815"], "July 14 is now France's national day."],
  ["fr", "Who founded France's Fifth Republic in 1958?", "Charles de Gaulle", ["François Mitterrand", "Georges Pompidou", "Napoleon III"], "De Gaulle became its first president in 1959."],
  ["fr", "What is the national motto of France?", "Liberté, égalité, fraternité", ["Dieu et mon droit", "Einigkeit und Recht und Freiheit", "E pluribus unum"], "It means “Liberty, equality, fraternity.”"],
  ["fr", "In what year was Napoleon crowned Emperor of the French?", "1804", ["1799", "1812", "1815"], "The coronation took place at Notre-Dame in Paris."],
  ["fr", "Joan of Arc helped lift the siege of which city in 1429?", "Orléans", ["Paris", "Reims", "Rouen"], "She is still called “the Maid of Orléans”."],
  ["fr", "What is France's national anthem called?", "La Marseillaise", ["Le Chant du Départ", "La Parisienne", "Ode to Joy"], "It was written in 1792 and named after volunteers from Marseille."],
  ["fr", "Which French king was known as the Sun King?", "Louis XIV", ["Louis XVI", "Henry IV", "Francis I"], "He reigned for 72 years and built the Palace of Versailles into his court."],
  ["fr", "In what year did the D-Day landings in Normandy take place?", "1944", ["1942", "1943", "1945"], "Allied forces landed on June 6, 1944."],
  ["de", "In what year did the Berlin Wall fall?", "1989", ["1985", "1990", "1991"], "The border opened on the night of November 9, 1989."],
  ["de", "In what year were East and West Germany reunified?", "1990", ["1989", "1991", "1994"], "Reunification took effect on October 3, 1990."],
  ["de", "Who was the first chancellor of West Germany?", "Konrad Adenauer", ["Ludwig Erhard", "Willy Brandt", "Helmut Kohl"], "Adenauer led West Germany from 1949 to 1963."],
  ["de", "Who became the first chancellor of the German Empire in 1871?", "Otto von Bismarck", ["Kaiser Wilhelm II", "Frederick the Great", "Helmuth von Moltke"], "He was known as the “Iron Chancellor”."],
  ["de", "In what year did Martin Luther publish his 95 Theses?", "1517", ["1492", "1534", "1555"], "They began the Protestant Reformation in Wittenberg."],
  ["de", "Which city was West Germany's capital before reunification?", "Bonn", ["Berlin", "Frankfurt", "Munich"], "Parliament and government moved to Berlin in 1999."],
  ["de", "Who brought movable-type printing to Europe around 1440?", "Johannes Gutenberg", ["Martin Luther", "Albrecht Dürer", "Johannes Kepler"], "He worked in Mainz; his Bible was printed in the 1450s."],
  ["de", "What is Germany's constitution called?", "The Basic Law", ["The Weimar Constitution", "The Federal Charter", "The Reich Constitution"], "The Grundgesetz was adopted in 1949."],
  ["pl", "What was the name of the Polish trade union movement led by Lech Wałęsa?", "Solidarity", ["Unity", "Freedom", "Liberty"], "Solidarność was founded in 1980 at the Gdańsk shipyard."],
  ["pl", "What was Pope John Paul II's name before he became pope?", "Karol Wojtyła", ["Józef Glemp", "Stefan Wyszyński", "Jan Sobieski"], "He was pope from 1978 to 2005, the first from Poland."],
  ["pl", "In what year did Poland adopt its Constitution of 3 May?", "1791", ["1683", "1772", "1918"], "It was Europe's first modern written national constitution."],
  ["pl", "Which Polish king led the relief of Vienna in 1683?", "John III Sobieski", ["Casimir the Great", "Bolesław the Brave", "Stanisław August Poniatowski"], "His winged hussars made the famous final charge."],
  ["pl", "Which astronomer from Poland put the Sun at the center of the solar system?", "Nicolaus Copernicus", ["Johannes Kepler", "Tycho Brahe", "Galileo Galilei"], "His book was published in 1543, the year he died."],
  ["pl", "In which city was Marie Curie born?", "Warsaw", ["Kraków", "Paris", "Gdańsk"], "She won Nobel Prizes in both physics and chemistry."],
  ["pl", "What is the capital of Poland?", "Warsaw", ["Kraków", "Gdańsk", "Wrocław"], "The royal court moved there from Kraków around 1596."],
  ["pl", "Which composer, born near Warsaw in 1810, is famous for his piano music?", "Frédéric Chopin", ["Franz Liszt", "Antonín Dvořák", "Bedřich Smetana"], "His heart was brought back to Warsaw and rests in the Holy Cross Church."],
  ["pl", "In what year did Poland join NATO?", "1999", ["1991", "2004", "1989"], "It joined together with the Czech Republic and Hungary."],
  ["econ", "Which body sets interest rates in the United States?", "The Federal Reserve", ["The Treasury", "Congress", "The Supreme Court"], "Its Federal Open Market Committee sets the target rate."],
  ["econ", "Who wrote “The Wealth of Nations” in 1776?", "Adam Smith", ["John Locke", "David Ricardo", "John Stuart Mill"], "It introduced the idea of the “invisible hand” of the market."],
  ["econ", "Which economist wrote “The Road to Serfdom” (1944)?", "Friedrich Hayek", ["Milton Friedman", "John Maynard Keynes", "Ludwig von Mises"], "Hayek later won the Nobel Prize in economics, in 1974."],
  ["econ", "The New York Stock Exchange is on which street?", "Wall Street", ["Broadway", "Park Avenue", "Fifth Avenue"], "Its roots go back to the Buttonwood Agreement, signed on Wall Street in 1792."],
  ["econ", "Which currency do France and Germany both use?", "The euro", ["The franc", "The Deutsche Mark", "The pound"], "Euro notes and coins arrived in 2002."],
  ["econ", "How many companies are in the Dow Jones Industrial Average?", "30", ["50", "100", "500"], "It is one of the oldest U.S. stock indexes, first published in 1896."],
  ["econ", "What is a market that has fallen 20% or more from its high called?", "A bear market", ["A bull market", "A correction", "A recession"], "A drop of about 10% is usually called a correction."],
];
const TRIVIA_CATS = [
  { id: "all", label: "Everything" }, { id: "us", label: "United States" }, { id: "uk", label: "Britain" },
  { id: "fr", label: "France" }, { id: "de", label: "Germany" }, { id: "pl", label: "Poland" }, { id: "econ", label: "Economy" },
];

// [word, hint]
const SCRAMBLE = [
  ["CONSTITUTION", "It begins “We the People”"], ["LIBERTY", "The statue in New York Harbor"], ["REPUBLIC", "A state without a monarch, run by elected officials"],
  ["PARLIAMENT", "Britain's lawmaking body"], ["SOLIDARITY", "The Polish movement that challenged communism"], ["BUNDESTAG", "Germany's parliament"],
  ["BASTILLE", "The Paris fortress stormed in 1789"], ["SOVEREIGNTY", "A nation's right to govern itself"], ["FEDERALIST", "Essays by Hamilton, Madison and Jay"],
  ["AMENDMENT", "A change to the Constitution"], ["SENATE", "The upper chamber of Congress"], ["CHANCELLOR", "Germany's head of government"],
  ["MONARCHY", "Rule by a king or queen"], ["INDEPENDENCE", "Declared in 1776"], ["WATERLOO", "Napoleon's final defeat"],
  ["WASHINGTON", "The first president"], ["CHURCHILL", "Britain's wartime prime minister"], ["COPERNICUS", "The astronomer from Toruń"],
  ["ELECTION", "How voters choose their leaders"], ["FREEDOM", "Liberty by another name"], ["FRONTIER", "The edge of settled land in the American West"],
  ["HERITAGE", "What one generation passes to the next"], ["TRADITION", "A custom handed down over time"], ["PATRIOT", "Someone devoted to their country"],
  ["VERSAILLES", "Louis XIV's palace"], ["GETTYSBURG", "Lincoln's famous address"], ["MAYFLOWER", "The Pilgrims' ship"], ["TRAFALGAR", "Nelson's last battle"],
  ["REUNIFICATION", "Germany, October 3, 1990"], ["CONGRESS", "The U.S. lawmaking branch"], ["DEMOCRACY", "Government by the people"], ["MAGNA CARTA", "The charter of 1215"],
];

// [event, year] — used by Timeline and Which came first?
const EVENTS = [
  ["The Battle of Hastings", 1066], ["Magna Carta is sealed", 1215], ["Joan of Arc lifts the siege of Orléans", 1429],
  ["Columbus reaches the Americas", 1492], ["Luther publishes his 95 Theses", 1517], ["Copernicus publishes his Sun-centered model", 1543],
  ["Jamestown is founded", 1607], ["The Pilgrims land at Plymouth", 1620], ["The Battle of Vienna", 1683],
  ["The Declaration of Independence", 1776], ["The U.S. Constitution is signed", 1787], ["The storming of the Bastille", 1789],
  ["Poland's Constitution of 3 May", 1791], ["The Louisiana Purchase", 1803], ["Napoleon is crowned emperor", 1804],
  ["The Battle of Trafalgar", 1805], ["“The Star-Spangled Banner” is written", 1814], ["The Battle of Waterloo", 1815],
  ["The Monroe Doctrine", 1823], ["Queen Victoria takes the throne", 1837], ["The Gettysburg Address", 1863],
  ["The United States buys Alaska", 1867], ["The German Empire is founded", 1871], ["The Wright brothers' first flight", 1903],
  ["The Federal Reserve is created", 1913], ["Poland regains independence", 1918], ["The Wall Street Crash", 1929],
  ["Churchill becomes prime minister", 1940], ["D-Day in Normandy", 1944], ["NATO is founded", 1949],
  ["Sputnik is launched", 1957], ["France's Fifth Republic begins", 1958], ["The first Moon landing", 1969],
  ["John Paul II becomes pope", 1978], ["Thatcher becomes prime minister", 1979], ["Solidarity is founded", 1980],
  ["Reagan says “Tear down this wall!”", 1987], ["The Berlin Wall falls", 1989], ["Germany is reunified", 1990],
  ["Poland joins NATO", 1999], ["Euro coins and notes arrive", 2002], ["Poland joins the European Union", 2004], ["The Brexit referendum", 2016],
];

const GAME_TABS = [
  { id: "trivia", label: "Trivia", icon: "?", blurb: "10 timed questions" },
  { id: "scramble", label: "Word puzzle", icon: "Ab", blurb: "Unscramble the word" },
  // Small drawn icons: the arrow and scale symbols don't show in every font.
  { id: "timeline", label: "Timeline", icon: `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M2 3h8v2H2zm0 4h10v2H2zm0 4h12v2H2z"/></svg>`, blurb: "Put events in order" },
  { id: "first", label: "Which came first?", icon: `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M7 1h2v2h4l2 6a3 3 0 0 1-6 0l1.8-5H9v9h3v2H4v-2h3V4H4.2L6 9a3 3 0 0 1-6 0l2-6h5zm-4 4.2L1.6 9h2.8zm10 0L11.6 9h2.8z"/></svg>`, blurb: "Keep the streak going" },
];

const games = {
  ready: false, tab: "trivia", stats: null, timer: 0,
  trivia: null, scramble: null, timeline: null, first: null,
};

// ---- Helpers ----

const gamesShuffle = list => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const gamesCalm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const gamesPanel = () => document.getElementById("games-panel");

function gamesLoadStats() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem("news-games") || "{}"); } catch { /* fresh */ }
  // Carry over best scores from the earlier version of the games.
  const old = key => { try { return Number(JSON.parse(localStorage.getItem(key))) || 0; } catch { return 0; } };
  games.stats = {
    points: s.points || 0,
    best: { trivia: 0, scramble: old("news-scramble-best"), timeline: 0, first: 0, ...(s.best || {}) },
    played: s.played || 0,
  };
}
function gamesSaveStats() {
  try { localStorage.setItem("news-games", JSON.stringify(games.stats)); } catch { /* fine without it */ }
}

// Add points to the running total, with a floating "+120" near `el`.
function gamesAward(points, el) {
  if (points <= 0) return;
  const from = games.stats.points;
  games.stats.points += points;
  gamesSaveStats();
  const out = document.getElementById("games-points");
  if (out) {
    const to = games.stats.points, start = performance.now();
    const tick = now => {
      const t = Math.min(1, (now - start) / 600);
      out.textContent = Math.round(from + (to - from) * t).toLocaleString();
      if (t < 1) requestAnimationFrame(tick);
    };
    gamesCalm() ? (out.textContent = to.toLocaleString()) : requestAnimationFrame(tick);
  }
  if (el && !gamesCalm()) {
    const pop = document.createElement("span");
    pop.className = "games-pop";
    pop.textContent = `+${points}`;
    const r = el.getBoundingClientRect(), box = document.getElementById("games-dialog").getBoundingClientRect();
    pop.style.left = `${r.left - box.left + r.width / 2}px`;
    pop.style.top = `${r.top - box.top}px`;
    document.getElementById("games-dialog").appendChild(pop);
    setTimeout(() => pop.remove(), 1100);
  }
}

function gamesBest(game, value) {
  const isNew = value > (games.stats.best[game] || 0);
  if (isNew) { games.stats.best[game] = value; gamesSaveStats(); gamesRenderCard(); }
  return isNew;
}

// A short burst of confetti for a great result.
function gamesConfetti() {
  if (gamesCalm()) return;
  const dialog = document.getElementById("games-dialog");
  const colors = ["#1c4f9c", "#5ea9e8", "#d7141a", "#f2c94c", "#2e8b57", "#ffffff"];
  for (let i = 0; i < 46; i++) {
    const c = document.createElement("i");
    c.className = "games-confetti";
    c.style.left = `${10 + Math.random() * 80}%`;
    c.style.background = colors[i % colors.length];
    c.style.setProperty("--dx", `${(Math.random() - 0.5) * 220}px`);
    c.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
    c.style.animationDelay = `${Math.random() * 0.25}s`;
    dialog.appendChild(c);
    setTimeout(() => c.remove(), 1900);
  }
}

function gamesFlash(el, cls) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth; // restart the animation
  el.classList.add(cls);
}

// ---- Window and tabs ----

function gamesOpen(tab = games.tab) {
  const dialog = document.getElementById("games-dialog");
  document.getElementById("games-points").textContent = games.stats.points.toLocaleString();
  if (!dialog.open) dialog.showModal();
  gamesShowTab(tab);
}

function gamesShowTab(tab) {
  clearInterval(games.timer);
  games.tab = tab;
  document.querySelectorAll("#games-dialog [data-game-tab]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.gameTab === tab)));
  ({ trivia: triviaStart, scramble: scrambleStart, timeline: timelineStart, first: firstStart })[tab]();
}

// The card in the sidebar: one button per game, with best scores.
function gamesRenderCard() {
  const box = document.getElementById("games-card");
  if (!box) return;
  const best = games.stats.best;
  const bestText = { trivia: `${best.trivia || 0} pts`, scramble: `streak ${best.scramble || 0}`, timeline: `${best.timeline || 0} pts`, first: `streak ${best.first || 0}` };
  box.innerHTML = `
    <div class="games-card-grid">
      ${GAME_TABS.map(g => `
        <button type="button" class="games-card-btn" data-open-game="${g.id}">
          <span class="games-ic" aria-hidden="true">${g.icon}</span>
          <span class="games-card-name">${g.label}</span>
          <span class="games-card-best">Best: ${bestText[g.id]}</span>
        </button>`).join("")}
    </div>
    <button type="button" class="news-btn games-play" data-open-game="${games.tab}">Play · ${games.stats.points.toLocaleString()} points</button>`;
}

// ---- Trivia ----

function triviaStart() {
  const t = games.trivia || { cat: "all" };
  games.trivia = { cat: t.cat, stage: "pick" };
  const counts = Object.fromEntries(TRIVIA_CATS.map(c => [c.id, c.id === "all" ? TRIVIA.length : TRIVIA.filter(q => q[0] === c.id).length]));
  gamesPanel().innerHTML = `
    <div class="games-intro">
      <h3>Trivia</h3>
      <p>Ten questions, 15 seconds each. Answer fast for bonus points, keep a streak going for a multiplier, and use the 50/50 once per round.</p>
      <div class="games-chips" role="group" aria-label="Category">
        ${TRIVIA_CATS.map(c => `<button type="button" data-cat="${c.id}" aria-pressed="${c.id === games.trivia.cat}">${c.label} <small>${counts[c.id]}</small></button>`).join("")}
      </div>
      <button type="button" class="news-btn games-go" data-act="trivia-go">Start round</button>
      <p class="games-best">Best round: ${games.stats.best.trivia || 0} points · Keys: 1–4 to answer, Enter for next</p>
    </div>`;
}

function triviaGo() {
  const t = games.trivia;
  const pool = TRIVIA.filter(q => t.cat === "all" || q[0] === t.cat);
  Object.assign(t, {
    stage: "play", i: 0, score: 0, right: 0, streak: 0, fifty: true,
    round: gamesShuffle(pool).slice(0, 10).map(([, q, right, wrong, fact]) => ({ q, right, options: gamesShuffle([right, ...wrong]), fact })),
  });
  triviaQuestion();
}

function triviaQuestion() {
  const t = games.trivia;
  const q = t.round[t.i];
  t.answered = false;
  t.left = 15;
  gamesPanel().innerHTML = `
    <div class="games-top">
      <span>Question ${t.i + 1} of ${t.round.length}</span>
      <span class="games-streak${t.streak >= 3 ? " hot" : ""}">${t.streak >= 3 ? `Streak ${t.streak} · ×1.5` : `Streak ${t.streak}`}</span>
      <span>Score <b id="trivia-score">${t.score}</b></span>
    </div>
    <div class="games-timer" aria-hidden="true"><span id="trivia-bar"></span></div>
    <p class="games-q">${escapeHtml(q.q)}</p>
    <div class="games-options">
      ${q.options.map((o, k) => `<button type="button" class="games-opt" data-answer="${escapeHtml(o)}"><kbd>${k + 1}</kbd>${escapeHtml(o)}</button>`).join("")}
    </div>
    <div class="games-row">
      <button type="button" class="games-link" data-act="trivia-fifty"${t.fifty ? "" : " disabled"}>50/50${t.fifty ? "" : " (used)"}</button>
      <span class="games-left" id="trivia-left">15 s</span>
    </div>
    <div class="games-fact" id="games-fact" aria-live="polite"></div>`;
  const bar = document.getElementById("trivia-bar");
  requestAnimationFrame(() => { bar.style.transition = "width 15s linear"; bar.style.width = "0%"; });
  clearInterval(games.timer);
  games.timer = setInterval(() => {
    t.left--;
    const left = document.getElementById("trivia-left");
    if (left) left.textContent = `${t.left} s`;
    if (t.left <= 5) bar?.classList.add("low");
    if (t.left <= 0) triviaAnswer(null);
  }, 1000);
}

function triviaAnswer(btn) {
  const t = games.trivia;
  if (t.answered) return;
  t.answered = true;
  clearInterval(games.timer);
  const bar = document.getElementById("trivia-bar");
  if (bar) { bar.style.width = getComputedStyle(bar).width; bar.style.transition = "none"; }
  const q = t.round[t.i];
  const ok = !!btn && btn.dataset.answer === q.right;
  let points = 0;
  if (ok) {
    t.streak++;
    t.right++;
    points = Math.round((100 + Math.max(0, t.left) * 10) * (t.streak >= 3 ? 1.5 : 1));
    t.score += points;
  } else {
    t.streak = 0;
  }
  document.querySelectorAll("#games-panel .games-opt").forEach(b => {
    b.disabled = true;
    if (b.dataset.answer === q.right) b.classList.add("right");
    else if (b === btn) b.classList.add("wrong");
  });
  if (ok) { gamesFlash(btn, "pulse"); gamesAward(points, btn); }
  else gamesFlash(btn || document.querySelector("#games-panel .games-options"), "shake");
  document.getElementById("trivia-score").textContent = t.score;
  const last = t.i === t.round.length - 1;
  document.getElementById("games-fact").innerHTML = `
    <b>${ok ? `Correct! +${points}` : btn ? `Not quite: ${escapeHtml(q.right)}.` : `Time's up: ${escapeHtml(q.right)}.`}</b> ${escapeHtml(q.fact)}
    <button type="button" class="news-btn games-next" data-act="trivia-next">${last ? "See results" : "Next question"}</button>`;
  document.querySelector("#games-panel .games-next").focus();
}

function triviaFifty() {
  const t = games.trivia;
  if (!t.fifty || t.answered) return;
  t.fifty = false;
  const q = t.round[t.i];
  gamesShuffle([...document.querySelectorAll("#games-panel .games-opt")].filter(b => b.dataset.answer !== q.right))
    .slice(0, 2).forEach(b => { b.disabled = true; b.classList.add("gone"); });
  const b = document.querySelector('[data-act="trivia-fifty"]');
  b.disabled = true;
  b.textContent = "50/50 (used)";
}

function triviaEnd() {
  const t = games.trivia;
  t.stage = "done";
  games.stats.played++;
  const isBest = gamesBest("trivia", t.score);
  const share = t.right / t.round.length;
  const msg = share === 1 ? "Perfect round!" : share >= 0.8 ? "Excellent!" : share >= 0.5 ? "Well done." : "Keep at it.";
  gamesPanel().innerHTML = `
    <div class="games-done">
      <p class="games-big">${t.score}</p>
      <p>points · ${t.right} of ${t.round.length} right</p>
      <p class="games-msg">${msg}${isBest ? " A new best!" : ` Best: ${games.stats.best.trivia}.`}</p>
      <div class="games-row center">
        <button type="button" class="news-btn" data-act="trivia-go">Play again</button>
        <button type="button" class="games-link" data-act="trivia-menu">Change category</button>
      </div>
    </div>`;
  if (isBest || share >= 0.8) gamesConfetti();
}

// ---- Word puzzle ----

function scrambleStart() {
  games.scramble ||= { order: [], i: 0, streak: 0 };
  scrambleNext();
}

function scrambleNext() {
  const s = games.scramble;
  if (!s.order.length || s.i >= s.order.length) { s.order = gamesShuffle(SCRAMBLE); s.i = 0; }
  const [word, hint] = s.order[s.i++];
  const letters = [...word.replace(/ /g, "")];
  let tiles;
  do tiles = gamesShuffle(letters.map((ch, k) => ({ ch, k })));
  while (tiles.map(t => t.ch).join("") === letters.join(""));
  Object.assign(s, { word, hint, letters, tiles, picked: [], hints: 0, solved: false });
  scrambleRender();
}

function scrambleRender(message = "") {
  const s = games.scramble;
  // Answer slots, keeping the gap in two-word answers like "MAGNA CARTA".
  const words = s.word.split(" ");
  let n = 0;
  const slots = words.map(w => `<span class="games-slotword">${[...w].map(() => {
    const k = n++, tile = s.picked[k];
    const fixed = k < s.hints;
    return `<button type="button" class="games-slot${tile ? " full" : ""}${fixed ? " fixed" : ""}" data-slot="${k}"${tile && !fixed && !s.solved ? "" : " tabindex=\"-1\""}>${tile ? tile.ch : ""}</button>`;
  }).join("")}</span>`).join("");
  const used = new Set(s.picked.filter(Boolean).map(t => t.k));
  gamesPanel().innerHTML = `
    <div class="games-top"><span>Unscramble the word</span><span class="games-streak${s.streak >= 3 ? " hot" : ""}">Streak ${s.streak}</span><span>Best ${games.stats.best.scramble || 0}</span></div>
    <p class="games-hint">${escapeHtml(s.hint)}</p>
    <div class="games-slots${s.solved ? " solved" : ""}" id="scramble-slots">${slots}</div>
    <div class="games-tiles">
      ${s.tiles.map((t, idx) => `<button type="button" class="games-tile" data-tile="${idx}"${used.has(t.k) || s.solved ? " disabled" : ""}>${t.ch}</button>`).join("")}
    </div>
    <div class="games-row">
      <button type="button" class="games-link" data-act="scramble-shuffle"${s.solved ? " disabled" : ""}>Shuffle</button>
      <button type="button" class="games-link" data-act="scramble-clear"${s.solved ? " disabled" : ""}>Clear</button>
      <button type="button" class="games-link" data-act="scramble-hint"${s.solved || s.hints >= s.letters.length - 1 ? " disabled" : ""}>Show a letter</button>
      <button type="button" class="news-btn" data-act="scramble-next">${s.solved ? "Next word" : "Skip"}</button>
    </div>
    <p class="games-fact" aria-live="polite">${message || "Tap the tiles in order, or type on your keyboard. Showing a letter resets your streak."}</p>`;
}

function scramblePlace(tileIdx) {
  const s = games.scramble;
  if (s.solved) return;
  const tile = s.tiles[tileIdx];
  if (s.picked.some(p => p && p.k === tile.k)) return;
  const slot = s.picked.findIndex((p, k) => !p && k >= s.hints);
  const at = slot === -1 ? Math.max(s.picked.length, s.hints) : slot;
  if (at >= s.letters.length) return;
  s.picked[at] = tile;
  scrambleRender();
  if (s.picked.filter(Boolean).length === s.letters.length) scrambleCheck();
}

function scrambleCheck() {
  const s = games.scramble;
  const guess = s.picked.map(t => t.ch).join("");
  if (guess === s.letters.join("")) {
    s.solved = true;
    s.streak++;
    gamesBest("scramble", s.streak);
    const points = Math.max(20, 60 + s.letters.length * 10 - s.hints * 30);
    scrambleRender(`<b>Correct!</b> It was ${escapeHtml(s.word)}. +${points}`);
    const slots = document.getElementById("scramble-slots");
    gamesFlash(slots, "pulse");
    gamesAward(points, slots);
    if (s.streak % 5 === 0) gamesConfetti();
    document.querySelector('[data-act="scramble-next"]').focus();
  } else {
    scrambleRender("Not quite. Tap a letter in the answer to take it back.");
    gamesFlash(document.getElementById("scramble-slots"), "shake");
  }
}

function scrambleHint() {
  const s = games.scramble;
  if (s.hints >= s.letters.length - 1) return;
  s.streak = 0;
  s.picked = [];
  s.hints++;
  // Put the right tiles in the first `hints` slots.
  const free = [...s.tiles];
  for (let k = 0; k < s.hints; k++) {
    const idx = free.findIndex(t => t && t.ch === s.letters[k]);
    s.picked[k] = free[idx];
    free[idx] = null;
  }
  scrambleRender();
}

// Typing letters works too.
function scrambleKey(e) {
  const s = games.scramble;
  if (!s || s.solved) return;
  if (e.key === "Backspace") {
    const last = s.picked.map((p, k) => (p && k >= s.hints ? k : -1)).filter(k => k >= 0).pop();
    if (last != null) { s.picked[last] = undefined; scrambleRender(); }
    e.preventDefault();
    return;
  }
  const ch = e.key.length === 1 ? e.key.toUpperCase() : "";
  if (!/[A-Z]/.test(ch)) return;
  const used = new Set(s.picked.filter(Boolean).map(t => t.k));
  const idx = s.tiles.findIndex(t => t.ch === ch && !used.has(t.k));
  if (idx >= 0) scramblePlace(idx);
}

// ---- Timeline ----

function timelineStart() {
  games.timeline = { round: 0, score: 0 };
  timelineNext();
}

function timelinePick() {
  // Four events far enough apart that the order is fair.
  for (;;) {
    const pick = gamesShuffle(EVENTS).slice(0, 4);
    const years = pick.map(e => e[1]).sort((a, b) => a - b);
    if (years.every((y, k) => !k || y - years[k - 1] >= 3)) return pick;
  }
}

function timelineNext() {
  const t = games.timeline;
  t.round++;
  t.cards = timelinePick().map(([name, year]) => ({ name, year }));
  t.order = [];
  t.checked = false;
  timelineRender();
}

function timelineRender(message = "") {
  const t = games.timeline;
  const sorted = [...t.cards].sort((a, b) => a.year - b.year);
  gamesPanel().innerHTML = `
    <div class="games-top"><span>Puzzle ${t.round} of 5</span><span>Score <b>${t.score}</b></span><span>Best ${games.stats.best.timeline || 0}</span></div>
    <p class="games-hint">Tap the events from <b>oldest</b> to <b>newest</b>. Tap again to undo.</p>
    <div class="games-timeline">
      ${t.cards.map((c, idx) => {
        const pos = t.order.indexOf(idx);
        const state = t.checked ? (sorted[pos] === c ? " right" : " wrong") : "";
        return `<button type="button" class="games-event${pos >= 0 ? " picked" : ""}${state}" data-event="${idx}"${t.checked ? " disabled" : ""}>
          <span class="games-event-n">${pos >= 0 ? pos + 1 : ""}</span>
          <span class="games-event-name">${escapeHtml(c.name)}</span>
          <span class="games-event-year">${t.checked ? c.year : ""}</span>
        </button>`;
      }).join("")}
    </div>
    ${t.checked ? `<ol class="games-answer">${sorted.map(c => `<li><b>${c.year}</b> ${escapeHtml(c.name)}</li>`).join("")}</ol>` : ""}
    <div class="games-row">
      ${t.checked
        ? `<button type="button" class="news-btn" data-act="timeline-next">${t.round >= 5 ? "See results" : "Next puzzle"}</button>`
        : `<button type="button" class="games-link" data-act="timeline-reset"${t.order.length ? "" : " disabled"}>Start over</button>
           <button type="button" class="news-btn" data-act="timeline-check"${t.order.length === 4 ? "" : " disabled"}>Check order</button>`}
    </div>
    <p class="games-fact" aria-live="polite">${message}</p>`;
}

function timelineTap(idx) {
  const t = games.timeline;
  if (t.checked) return;
  const at = t.order.indexOf(idx);
  if (at >= 0) t.order.splice(at, 1);
  else t.order.push(idx);
  timelineRender();
}

function timelineCheck() {
  const t = games.timeline;
  const sorted = [...t.cards].sort((a, b) => a.year - b.year);
  const right = t.order.filter((idx, pos) => sorted[pos] === t.cards[idx]).length;
  const points = right * 50 + (right === 4 ? 100 : 0);
  t.score += points;
  t.checked = true;
  timelineRender(right === 4 ? `<b>All four in order!</b> +${points}` : `<b>${right} of 4 in the right place.</b>${points ? ` +${points}` : ""}`);
  const box = document.querySelector("#games-panel .games-timeline");
  gamesFlash(box, right === 4 ? "pulse" : "shake");
  gamesAward(points, box);
}

function timelineEnd() {
  const t = games.timeline;
  games.stats.played++;
  const isBest = gamesBest("timeline", t.score);
  gamesPanel().innerHTML = `
    <div class="games-done">
      <p class="games-big">${t.score}</p>
      <p>points from 5 puzzles (best possible 1,500)</p>
      <p class="games-msg">${isBest ? "A new best!" : `Best: ${games.stats.best.timeline}.`}</p>
      <button type="button" class="news-btn" data-act="timeline-again">Play again</button>
    </div>`;
  if (isBest || t.score >= 1200) gamesConfetti();
}

// ---- Which came first? ----

function firstStart() {
  games.first = { streak: 0, over: false };
  firstNext();
}

function firstNext() {
  const f = games.first;
  let a, b;
  do [a, b] = gamesShuffle(EVENTS).slice(0, 2);
  while (a[1] === b[1]);
  f.pair = [a, b];
  f.answered = false;
  firstRender();
}

function firstRender(message = "") {
  const f = games.first;
  gamesPanel().innerHTML = `
    <div class="games-top"><span>Which happened first?</span><span class="games-streak${f.streak >= 5 ? " hot" : ""}">Streak ${f.streak}</span><span>Best ${games.stats.best.first || 0}</span></div>
    <div class="games-versus">
      ${f.pair.map(([name, year], idx) => `
        <button type="button" class="games-card-pick" data-first="${idx}"${f.answered ? " disabled" : ""}>
          <span class="games-event-name">${escapeHtml(name)}</span>
          <span class="games-year" data-year="${year}">${f.answered ? year : "?"}</span>
        </button>${idx === 0 ? `<span class="games-vs">or</span>` : ""}`).join("")}
    </div>
    <div class="games-row center">
      ${f.answered ? (f.over
        ? `<button type="button" class="news-btn" data-act="first-again">Try again</button>`
        : `<button type="button" class="news-btn" data-act="first-next">Next pair</button>`) : ""}
    </div>
    <p class="games-fact" aria-live="polite">${message || "One wrong answer ends the run. How long can you keep it going?"}</p>`;
}

function firstPick(idx) {
  const f = games.first;
  if (f.answered) return;
  f.answered = true;
  const [a, b] = f.pair;
  const earlier = a[1] < b[1] ? 0 : 1;
  const ok = idx === earlier;
  let msg;
  if (ok) {
    f.streak++;
    gamesBest("first", f.streak);
    const points = 25 * f.streak;
    msg = `<b>Right!</b> ${f.pair[earlier][1]} vs ${f.pair[1 - earlier][1]}: ${Math.abs(a[1] - b[1])} years apart. +${points}`;
    firstRender(msg);
    const cards = document.querySelectorAll("#games-panel .games-card-pick");
    cards[earlier].classList.add("right");
    gamesFlash(cards[earlier], "pulse");
    gamesAward(points, cards[earlier]);
    if (f.streak % 10 === 0) gamesConfetti();
  } else {
    f.over = true;
    games.stats.played++;
    gamesSaveStats();
    msg = `<b>Not this time.</b> ${f.pair[earlier][1]} came before ${f.pair[1 - earlier][1]}. Your run: ${f.streak}.`;
    firstRender(msg);
    const cards = document.querySelectorAll("#games-panel .games-card-pick");
    cards[earlier].classList.add("right");
    cards[idx].classList.add("wrong");
    gamesFlash(cards[idx], "shake");
  }
  // Count the years up for a bit of drama.
  if (!gamesCalm()) {
    document.querySelectorAll("#games-panel .games-year").forEach(el => {
      const to = Number(el.dataset.year), from = to - 60, start = performance.now();
      const tick = now => {
        const t = Math.min(1, (now - start) / 500);
        el.textContent = Math.round(from + (to - from) * (1 - (1 - t) ** 3));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }
  document.querySelector('#games-panel [data-act="first-next"], #games-panel [data-act="first-again"]')?.focus();
}

// ---- Setup ----

function gamesInit() {
  if (games.ready) return;
  games.ready = true;
  gamesLoadStats();
  gamesRenderCard();
  const dialog = document.getElementById("games-dialog");
  document.getElementById("games-tabs").innerHTML = GAME_TABS.map(g =>
    `<button type="button" role="tab" data-game-tab="${g.id}" aria-selected="false"><span class="games-ic" aria-hidden="true">${g.icon}</span>${g.label}</button>`).join("");

  document.getElementById("games-card").addEventListener("click", e => {
    const b = e.target.closest("[data-open-game]");
    if (b) gamesOpen(b.dataset.openGame);
  });
  document.getElementById("games-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => { clearInterval(games.timer); gamesRenderCard(); });

  dialog.addEventListener("click", e => {
    const tab = e.target.closest("[data-game-tab]");
    if (tab) return gamesShowTab(tab.dataset.gameTab);
    const cat = e.target.closest("[data-cat]");
    if (cat) {
      games.trivia.cat = cat.dataset.cat;
      document.querySelectorAll("#games-panel [data-cat]").forEach(b => b.setAttribute("aria-pressed", String(b === cat)));
      return;
    }
    const opt = e.target.closest(".games-opt");
    if (opt) return triviaAnswer(opt);
    const tile = e.target.closest("[data-tile]");
    if (tile) return scramblePlace(Number(tile.dataset.tile));
    const slot = e.target.closest("[data-slot]");
    if (slot) {
      const s = games.scramble, k = Number(slot.dataset.slot);
      if (!s.solved && k >= s.hints && s.picked[k]) { s.picked[k] = undefined; scrambleRender(); }
      return;
    }
    const ev = e.target.closest("[data-event]");
    if (ev) return timelineTap(Number(ev.dataset.event));
    const pick = e.target.closest("[data-first]");
    if (pick) return firstPick(Number(pick.dataset.first));
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act) return;
    const t = games.trivia;
    ({
      "trivia-go": triviaGo,
      "trivia-menu": triviaStart,
      "trivia-fifty": triviaFifty,
      "trivia-next": () => { t.i++; t.i >= t.round.length ? triviaEnd() : triviaQuestion(); },
      "scramble-next": () => { if (!games.scramble.solved) games.scramble.streak = 0; scrambleNext(); },
      "scramble-shuffle": () => { games.scramble.tiles = gamesShuffle(games.scramble.tiles); scrambleRender(); },
      "scramble-clear": () => { games.scramble.picked = games.scramble.picked.slice(0, games.scramble.hints); scrambleRender(); },
      "scramble-hint": scrambleHint,
      "timeline-reset": () => { games.timeline.order = []; timelineRender(); },
      "timeline-check": timelineCheck,
      "timeline-next": () => (games.timeline.round >= 5 ? timelineEnd() : timelineNext()),
      "timeline-again": timelineStart,
      "first-next": firstNext,
      "first-again": firstStart,
    })[act]?.();
  });

  // Keyboard: 1–4 answer trivia, Enter moves on, letters type the word puzzle. Listen on the
  // whole page while the window is open, since redrawing the puzzle can move focus out of it.
  document.addEventListener("keydown", e => {
    if (!dialog.open) return;
    if (games.tab === "trivia" && games.trivia?.stage === "play") {
      const n = Number(e.key);
      if (n >= 1 && n <= 4 && !games.trivia.answered) {
        const b = document.querySelectorAll("#games-panel .games-opt")[n - 1];
        if (b && !b.disabled) triviaAnswer(b);
      }
    } else if (games.tab === "scramble" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      scrambleKey(e);
    }
  });
}
