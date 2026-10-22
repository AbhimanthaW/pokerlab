import {
  Component,
  useEffect,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  BookOpen,
  ChartNoAxesCombined,
  ChevronRight,
  FlaskConical,
  GraduationCap,
  Layers3,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { gameReducer, initialGame } from "../domain/game";
import type { ExerciseRecord, Settings as Preferences } from "../domain/types";
import {
  appendRecord,
  EMPTY_TOTALS,
  loadData,
  saveData,
  summarize,
  type AppData,
} from "../lib/storage";
import Practice from "../features/Practice";
import Trainer from "../features/Trainer";
import Reference from "../features/Reference";
import Progress from "../features/Progress";
import Settings from "../features/Settings";
const pages = [
  { id: "practice", label: "Practice Table", icon: Layers3 },
  { id: "trainer", label: "Hand Trainer", icon: GraduationCap },
  { id: "rankings", label: "Hand Rankings", icon: BookOpen },
  { id: "progress", label: "Progress", icon: ChartNoAxesCombined },
  { id: "settings", label: "Settings", icon: Settings2 },
] as const;
type Page = (typeof pages)[number]["id"];
function getPage(): Page {
  const value = window.location.hash.slice(1);
  return pages.some((p) => p.id === value) ? (value as Page) : "practice";
}
class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="fatal-error">
        <h1>Let’s get you back to the table.</h1>
        <p>
          The app hit an unexpected state. Reload to start a fresh hand; saved
          learning progress stays on this device.
        </p>
        <button
          className="primary-button"
          onClick={() => window.location.reload()}
        >
          Reload PokerLab
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function PokerLab() {
  const [initialData] = useState(() => loadData());
  const [data, setData] = useState<AppData>(initialData);
  const [warning, setWarning] = useState(initialData.warning);
  const [page, setPage] = useState<Page>(getPage);
  const [game, dispatch] = useReducer(gameReducer, initialGame);
  useEffect(() => {
    const warning = saveData(data);
    // A storage failure must be shown to the user when synchronizing with localStorage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (warning) setWarning(warning);
  }, [data]);
  useEffect(() => {
    const listener = () => setPage(getPage());
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);
  function navigate(next: Page) {
    window.location.hash = next;
    setPage(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function record(result: ExerciseRecord) {
    setData((prev) => appendRecord(prev, result));
  }
  function changeSettings(settings: Preferences) {
    setData((prev) => ({ ...prev, settings }));
  }
  const stats = summarize(data.records, data.totals);
  return (
    <div
      className={`app-shell ${data.settings.reducedMotion ? "reduce-motion" : ""} ${data.settings.fourColor ? "four-color" : ""}`}
      style={
        {
          "--motion-duration":
            data.settings.animation === "slow"
              ? "550ms"
              : data.settings.animation === "fast"
                ? "120ms"
                : "280ms",
        } as React.CSSProperties
      }
    >
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#practice"
          onClick={() => navigate("practice")}
          aria-label="PokerLab home"
        >
          <span className="brand-mark">
            <FlaskConical size={22} />
          </span>
          <span>
            Poker<span className="brand-light">Lab</span>
            <small>THE ART OF THE HAND</small>
          </span>
        </a>
        <div className="nav-label">YOUR PRACTICE SPACE</div>
        <nav aria-label="Main navigation">
          {pages.map(({ id, label, icon: Icon }) => (
            <a
              href={`#${id}`}
              key={id}
              onClick={() => navigate(id)}
              className={`nav-link ${page === id ? "active" : ""}`}
              aria-label={label}
              title={label}
              aria-current={page === id ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
              {page === id && (
                <ChevronRight className="nav-chevron" size={14} />
              )}
            </a>
          ))}
        </nav>
        <div className="sidebar-note">
          <div className="note-suit">♠</div>
          <p>
            Good hands begin
            <br />
            with understanding.
          </p>
          <span>Every reveal is a lesson.</span>
          <button onClick={() => navigate("rankings")}>
            Learn the fundamentals <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <ShieldCheck size={15} />
          <span>
            Just you and the cards.<small>No accounts. No stakes.</small>
          </span>
          <span className="version">V1.0</span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Your practice space <ChevronRight size={13} />
            <span>{pages.find((p) => p.id === page)?.label}</span>
          </div>
          <div className="topbar-progress">
            <span className="status-dot" />
            <span>{stats.completed} exercises completed</span>
            <span className="topbar-divider" />
            <span className="profile-avatar">Y</span>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          {warning && (
            <div className="storage-warning" role="status">
              {warning}
              <button
                className="text-button"
                onClick={() => setWarning(undefined)}
              >
                Dismiss
              </button>
            </div>
          )}
          <div hidden={page !== "practice"}>
            <Practice
              game={game}
              dispatch={dispatch}
              settings={data.settings}
              onRecord={record}
              onReference={() => navigate("rankings")}
            />
          </div>
          {page === "trainer" && (
            <Trainer
              key={data.settings.difficulty}
              difficulty={data.settings.difficulty}
              onRecord={record}
            />
          )}
          {page === "rankings" && (
            <Reference onPractice={() => navigate("practice")} />
          )}
          {page === "progress" && (
            <Progress
              records={data.records}
              totals={data.totals}
              onPractice={() => navigate("trainer")}
            />
          )}
          {page === "settings" && (
            <Settings
              settings={data.settings}
              onChange={changeSettings}
              onReset={() =>
                setData((prev) => ({
                  ...prev,
                  records: [],
                  totals: structuredClone(EMPTY_TOTALS),
                }))
              }
            />
          )}
        </main>
      </div>
    </div>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <PokerLab />
    </ErrorBoundary>
  );
}
