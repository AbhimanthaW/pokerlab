import { useState } from "react";
import { CardView } from "../../components/Cards";
import { createDeck, SUITS, RANKS } from "../../domain/cards";
import { CATEGORIES, type Card, type Suit, type Rank } from "../../domain/types";
import { atLeastOne, EXACT_LIMIT, nextCard, outcomeCount, randomScenario, unseenCards, wilson, type LabScenario } from "../../domain/probability-lab/engine";
import { useCalculation } from "./useCalculation";
import "./probability.css";
const empty = (): LabScenario => ({ privateCards: [], board: [], unavailable: [] });
const deck = createDeck();
const percent = (n: number) => `${(n * 100).toFixed(2)}%`;
export default function ProbabilityLab() {
  const [scenario, setScenario] = useState<LabScenario>(empty), [destination, setDestination] = useState<keyof LabScenario>("privateCards");
  const [suit, setSuit] = useState<Suit>("hearts"), [rank, setRank] = useState<Rank>(14), [draws, setDraws] = useState(2);
  const [samples, setSamples] = useState("5000"), [seed, setSeed] = useState("42"), [target, setTarget] = useState(5), [error, setError] = useState<string>();
  const calculation = useCalculation();
  const unseen = unseenCards(scenario), suitRatio = nextCard(scenario, { suit }), rankRatio = nextCard(scenario, { rank });
  const multiple = atLeastOne(unseen.length, suitRatio.favorable, draws);
  const combinations = scenario.privateCards.length === 2 ? outcomeCount(scenario) : null;
  const selected = new Set([...scenario.privateCards, ...scenario.board, ...scenario.unavailable].map((c) => c.id));
  const change = (next: LabScenario) => { try { unseenCards(next); calculation.reset(); setScenario(next); setError(undefined); } catch (e) { setError(e instanceof Error ? e.message : "Invalid scenario"); } };
  const add = (card: Card) => {
    if (selected.has(card.id)) return;
    const limit = destination === "privateCards" ? 2 : destination === "board" ? 5 : 20;
    if (scenario[destination].length >= limit) { setError(`This selection holds at most ${limit} cards. Remove a card first.`); return; }
    change({ ...scenario, [destination]: [...scenario[destination], card] });
  };
  const validRun = seed !== "" && Number.isSafeInteger(Number(samples)) && Number(samples) >= 100 && Number(samples) <= 100000 && Number.isSafeInteger(Number(seed)) && Number(seed) >= 0 && Number(seed) <= 4294967295;
  const exact = calculation.exact, simulation = calculation.simulation;
  const currentCategory = CATEGORIES[target];
  return <div className="probability-lab">
    <div className="page-heading"><span className="eyebrow">LEARN / FINITE DECKS</span><h1>Probability Lab</h1><p className="muted">Build a separate card experiment. Count possibilities, then compare them with repeated random trials.</p></div>
    <section className="panel lab-scenario" aria-label="Card scenario"><div className="lab-section-title"><h2>Your known information</h2><div className="toolbar"><button className="secondary-button" onClick={() => change(empty())}>Reset scenario</button><button className="secondary-button" onClick={() => change(randomScenario(scenario.board.length))}>Randomize scenario</button></div></div>
      <p><strong>{unseen.length} unseen cards</strong> · {52 - unseen.length} known unavailable to the next draw</p>
      <p className="muted">Use two private cards for final-hand experiments. Board cards may number 0–5. Additional unavailable cards are excluded from every draw.</p>
      <div className="lab-known">{(["privateCards", "board", "unavailable"] as const).map((group) => <div key={group}><h3>{group === "privateCards" ? "Private cards" : group === "board" ? "Community cards" : "Known unavailable cards"} ({scenario[group].length})</h3><div className="lab-selected">{scenario[group].map((c) => <button className="lab-card-button" key={c.id} aria-label={`Remove ${c.id} from ${group}`} title={`Remove ${c.id}`} onClick={() => change({ ...scenario, [group]: scenario[group].filter((a) => a.id !== c.id) })}><CardView card={c} small /><span>×</span></button>)}{!scenario[group].length && <span className="muted">None selected</span>}</div></div>)}</div>
      <label className="lab-label">Add cards to<select aria-label="Card destination" value={destination} onChange={(e) => setDestination(e.target.value as keyof LabScenario)}><option value="privateCards">Private cards (2)</option><option value="board">Community cards (up to 5)</option><option value="unavailable">Known unavailable (up to 20)</option></select></label>
      <div className="lab-deck" aria-label="Select from the standard 52-card deck">{deck.map((c) => <button className="lab-card-button" disabled={selected.has(c.id)} key={c.id} aria-label={`Select ${c.id}`} onClick={() => add(c)}><CardView card={c} small /></button>)}</div>
      {error && <p role="alert">{error}</p>}
    </section>
    <section className="panel" aria-label="Exact drawing probabilities"><h2>Count the next draw</h2><div className="lab-question-controls"><label>Suit<select aria-label="Target suit" value={suit} onChange={(e) => setSuit(e.target.value as Suit)}>{SUITS.map((s) => <option key={s}>{s}</option>)}</select></label><label>Rank<select aria-label="Target rank" value={rank} onChange={(e) => setRank(Number(e.target.value) as Rank)}>{RANKS.map((r) => <option key={r} value={r}>{r === 14 ? "Ace" : r === 13 ? "King" : r === 12 ? "Queen" : r === 11 ? "Jack" : r}</option>)}</select></label><label>Draw count<select aria-label="Draw count" value={draws} onChange={(e) => setDraws(Number(e.target.value))}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></label></div>
      <div className="lab-ratios"><article><strong>{suitRatio.favorable} / {suitRatio.total}</strong><span>{percent(suitRatio.favorable / suitRatio.total)} · next card is {suit}</span><p>13 {suit} − {13 - suitRatio.favorable} known = {suitRatio.favorable} remaining, among {suitRatio.total} unseen cards.</p></article><article><strong>{rankRatio.favorable} / {rankRatio.total}</strong><span>{percent(rankRatio.favorable / rankRatio.total)} · next card has selected rank</span><p>4 cards of each rank − {4 - rankRatio.favorable} known = {rankRatio.favorable} remaining.</p></article><article><strong>{multiple.favorable.toLocaleString()} / {multiple.total.toLocaleString()}</strong><span>{percent(multiple.favorable / multiple.total)} · at least one {suit} in {draws} draws</span><p>1 − C({unseen.length - suitRatio.favorable}, {draws}) / C({unseen.length}, {draws}). Draws are without replacement; they are dependent.</p></article></div>
    </section>
    <section className="panel" aria-label="Final hand distribution"><h2>Complete the board</h2><p className="muted">Classify the best five of your two private cards and five community cards. All unseen completions are equally likely; opponents and wagering decisions are outside this experiment.</p>
      <p>{combinations === null ? "Select exactly two private cards to calculate a final-hand distribution." : `${combinations.toLocaleString()} unordered board completions · choose ${5 - scenario.board.length} from ${unseen.length}.`}</p>
      <div className="lab-question-controls"><label>Simulation trials<input aria-label="Simulation trials" type="number" min="100" max="100000" step="100" value={samples} onChange={(e) => setSamples(e.target.value)} /></label><label>Experiment seed<input aria-label="Experiment seed" type="number" min="0" max="4294967295" step="1" value={seed} onChange={(e) => setSeed(e.target.value)} /></label></div>
      <div className="toolbar lab-runs"><button className="primary-button" disabled={calculation.busy || combinations === null || combinations > EXACT_LIMIT} onClick={() => calculation.run(scenario, "exact", Number(samples), Number(seed))}>Calculate exact distribution</button><button className="secondary-button" disabled={calculation.busy || combinations === null || !validRun} onClick={() => calculation.run(scenario, "simulation", Number(samples), Number(seed))}>Run simulation</button>{calculation.busy && <button className="secondary-button" onClick={calculation.cancel}>Cancel calculation</button>}</div>
      {combinations !== null && combinations > EXACT_LIMIT && <p className="muted">Exact enumeration is capped at {EXACT_LIMIT.toLocaleString()} combinations. Add more known community cards or use the labeled simulation estimate.</p>}
      {!validRun && <p role="status">Use 100–100,000 whole trials and a seed from 0 through 4,294,967,295.</p>}
      {calculation.busy && <label>Calculation progress<progress aria-label="Calculation progress" max="1" value={calculation.progress} /></label>}
      {calculation.cancelled && <p role="status">Calculation cancelled. Previous completed results are retained.</p>}
      {calculation.error && <p role="alert">{calculation.error}</p>}
      {(exact || simulation) && <><div className="lab-results" tabIndex={0} role="region" aria-label="Probability results"><table><caption>Best final hand categories · {exact ? `${exact.total.toLocaleString()} exact outcomes` : "exact not calculated"}{simulation ? ` · ${simulation.total.toLocaleString()} simulated trials, seed ${simulation.seed}` : ""}</caption><thead><tr><th>Category</th><th>Exact count / outcomes</th><th>Exact probability</th><th>Simulated frequency</th><th>Estimated 95% interval</th><th>Absolute error</th></tr></thead><tbody>{CATEGORIES.map((category, i) => {
        const e = exact ? exact.counts[i] / exact.total : null, m = simulation ? simulation.counts[i] / simulation.total : null, interval = simulation ? wilson(simulation.counts[i], simulation.total) : null;
        return <tr key={category}><th scope="row">{category}<span className="lab-bar" style={{ width: `${100 * (e ?? m ?? 0)}%` }} /></th><td>{exact ? `${exact.counts[i]} / ${exact.total}` : "—"}</td><td>{e === null ? "—" : percent(e)}</td><td>{m === null ? "—" : `${simulation!.counts[i]} / ${simulation!.total} (${percent(m)})`}</td><td>{interval ? `${percent(interval[0])}–${percent(interval[1])}` : "—"}</td><td>{e !== null && m !== null ? `${(Math.abs(e - m) * 100).toFixed(2)} pp` : "—"}</td></tr>;
      })}</tbody></table></div>
      <label className="lab-label">Selected category threshold<select aria-label="Category threshold" value={target} onChange={(e) => setTarget(Number(e.target.value))}>{CATEGORIES.map((c, i) => <option value={i} key={c}>{c}</option>)}</select></label>
      <p>Finishing with {currentCategory} or a higher category: {exact ? `exact ${exact.counts.slice(target).reduce((a, b) => a + b, 0)} / ${exact.total} (${percent(exact.counts.slice(target).reduce((a, b) => a + b, 0) / exact.total)})` : "exact unavailable"}{simulation ? `; estimated ${percent(simulation.counts.slice(target).reduce((a, b) => a + b, 0) / simulation.total)}` : ""}.</p>
      <p className="muted">Rows describe the best category exactly: a straight flush appears in its own row, not in the flush row. Thresholds follow hand-ranking order. Simulation intervals are per-category Wilson 95% intervals, not simultaneous guarantees. Frequencies fluctuate; additional trials do not guarantee a monotonic decrease in error. Run both methods on the same scenario to compare.</p></>}
    </section>
  </div>;
}
