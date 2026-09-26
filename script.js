/**
 * ANTIBODY — Interactive Laboratory & Presentation Engine
 * IBM Bob 2.0 Hackathon (September 2026)
 */

// --- Specimen Data Repository ---
const SPECIMENS = {
  datetime: {
    id: "datetime",
    title_en: "Naive vs. Aware Datetime in Distributed Tasks",
    title_es: "Datetime Naive vs. Aware en Tareas Distribuidas",
    issue: "#412",
    original_file: "billing/invoices.py",
    original_line: 88,
    root_cause_en: "Comparison or arithmetic between a timezone-aware datetime (from DB) and naive datetime.now() without tz argument.",
    root_cause_es: "Comparación o aritmética entre datetime con zona horaria (DB) y un datetime.now() naive sin argumento tz.",
    why_it_breaks_en: "Python raises TypeError: can't compare offset-naive and offset-aware datetimes, crashing execution at runtime.",
    why_it_breaks_es: "Python lanza TypeError: no puede comparar datetimes con y sin zona horaria, crasheando en producción.",
    twins: [
      {
        id: "c01",
        file: "billing/subscriptions.py",
        line: 142,
        status: "fixed",
        reason_en: "renews_at is loaded from aware column and compared with naive now()",
        reason_es: "renews_at proviene de columna con zona horaria y se compara con now() naive",
        test_fail_log: "FAILED tests/test_subscriptions.py::test_renewal_check - TypeError: can't compare offset-naive and offset-aware datetimes",
        test_pass_log: "PASSED tests/test_subscriptions.py::test_renewal_check [100%]"
      },
      {
        id: "c02",
        file: "billing/reminders.py",
        line: 57,
        status: "fixed",
        reason_en: "utcnow() is naive too; subtracting it from aware due_at raises TypeError",
        reason_es: "utcnow() también es naive; restarlo de due_at consciente produce TypeError",
        test_fail_log: "FAILED tests/test_reminders.py::test_reminder_grace_period - TypeError: can't subtract offset-naive and offset-aware datetimes",
        test_pass_log: "PASSED tests/test_reminders.py::test_reminder_grace_period [100%]"
      },
      {
        id: "c03",
        file: "billing/api/webhooks.py",
        line: 203,
        status: "fixed",
        reason_en: "received_at parsed with explicit offset is aware, compared to naive timestamp",
        reason_es: "received_at parseado con offset explícito es consciente, comparado con timestamp naive",
        test_fail_log: "FAILED tests/test_webhooks.py::test_signature_timestamp - TypeError: can't compare offset-naive and offset-aware datetimes",
        test_pass_log: "PASSED tests/test_webhooks.py::test_signature_timestamp [100%]"
      },
      {
        id: "c04",
        file: "billing/reports/monthly.py",
        line: 31,
        status: "suspected",
        reason_en: "Cutoff compared with aware values inside async Celery worker (not testable in isolation)",
        reason_es: "Cutoff comparado con valores con timezone dentro de worker Celery (no aislable)",
        test_fail_log: "SKIPPED tests/test_reports.py - requires live Celery broker and Postgres instance",
        test_pass_log: "STATUS: Marked as suspected (requires manual end-to-end integration)"
      },
      {
        id: "c05",
        file: "billing/logging_utils.py",
        line: 12,
        status: "rejected",
        reason_en: "Naive now() formatted only as string timestamp; never compared or subtracted",
        reason_es: "now() naive formateado únicamente como string; jamás se compara ni resta",
        test_fail_log: "REJECTED - Static analysis confirms safe usage (string representation only)",
        test_pass_log: "REJECTED - Not a twin"
      }
    ],
    rounds: [
      {
        round: 0,
        label: "Round 0 (Baseline)",
        score: 17,
        ratio: "1 / 6 caught",
        variants: {
          v01: { state: "detected", detectedBy: ["Existing Unit Tests"] },
          v02: { state: "escaped", detectedBy: [] },
          v03: { state: "escaped", detectedBy: [] },
          v04: { state: "escaped", detectedBy: [] },
          v05: { state: "escaped", detectedBy: [] },
          v06: { state: "escaped", detectedBy: [] }
        }
      },
      {
        round: 1,
        label: "Round 1 (Initial Semgrep Rule)",
        score: 50,
        ratio: "3 / 6 caught",
        variants: {
          v01: { state: "detected", detectedBy: ["rule.v1", "tests"] },
          v02: { state: "detected", detectedBy: ["rule.v1"] },
          v03: { state: "escaped", detectedBy: [] },
          v04: { state: "escaped", detectedBy: [] },
          v05: { state: "escaped", detectedBy: [] },
          v06: { state: "detected", detectedBy: ["rule.v1"] }
        }
      },
      {
        round: 2,
        label: "Round 2 (Hardened Vaccine)",
        score: 100,
        ratio: "6 / 6 caught (100% Immunity)",
        variants: {
          v01: { state: "detected", detectedBy: ["rule.v2", "tests"] },
          v02: { state: "detected", detectedBy: ["rule.v2"] },
          v03: { state: "detected", detectedBy: ["rule.v2"] },
          v04: { state: "detected", detectedBy: ["rule.v2"] },
          v05: { state: "detected", detectedBy: ["rule.v2"] },
          v06: { state: "detected", detectedBy: ["rule.v2"] }
        }
      }
    ],
    variants_info: {
      v01: {
        title_en: "Original comparison in invoices.py",
        title_es: "Comparación original en invoices.py",
        type: "Syntax",
        code: "- if invoice.expires_at < datetime.now():\n+ if invoice.expires_at < datetime.now(timezone.utc):",
        semgrep_pattern: "pattern: $X < datetime.now()\npattern-where-python: is_aware($X)",
        explanation_en: "Standard direct comparison reintroduced in modified code.",
        explanation_es: "Comparación directa estándar reintroducida en el código modificado."
      },
      v02: {
        title_en: "Relocated comparison in refunds module",
        title_es: "Comparación reubicada en módulo refunds",
        type: "Relocation",
        code: "- return refund.issued_at > datetime.now()\n+ return refund.issued_at > datetime.now(timezone.utc)",
        semgrep_pattern: "pattern: $X > datetime.now()",
        explanation_en: "The identical mistake placed in a newly created microservice file.",
        explanation_es: "El idéntico error ubicado en un nuevo archivo o microservicio."
      },
      v03: {
        title_en: "Arithmetic Subtraction: (due_at - now()).days",
        title_es: "Resta aritmética: (due_at - now()).days",
        type: "Operator Mutation",
        code: "- delta = (invoice.due_at - datetime.now()).days\n+ delta = (invoice.due_at - datetime.now(timezone.utc)).days",
        semgrep_pattern: "pattern-either:\n  - pattern: $X - datetime.now()\n  - pattern: datetime.now() - $X",
        explanation_en: "Red team attacked with arithmetic subtraction instead of comparison operators.",
        explanation_es: "El equipo rojo atacó con resta aritmética en lugar de operadores de comparación."
      },
      v04: {
        title_en: "API Alias: datetime.utcnow()",
        title_es: "Alias de API: datetime.utcnow()",
        type: "API Alias",
        code: "- if record.created_at < datetime.utcnow():\n+ if record.created_at < datetime.now(timezone.utc):",
        semgrep_pattern: "pattern: datetime.utcnow()",
        explanation_en: "Red team substituted now() with utcnow() which is still naive in Python.",
        explanation_es: "El equipo rojo sustituyó now() por utcnow(), el cual sigue siendo naive en Python."
      },
      v05: {
        title_en: "Variable Indirection & Scoping",
        title_es: "Indirección de variables y alcance",
        type: "Indirection",
        code: "current_ts = datetime.now()\n# ... 15 lines later ...\n- if item.timestamp < current_ts:\n+ # Caught via dataflow tracking",
        semgrep_pattern: "pattern: | \n  $T = datetime.now(...)\n  ...\n  $X < $T",
        explanation_en: "Red team hid the naive creation in a helper variable evaluated 15 lines downstream.",
        explanation_es: "El equipo rojo ocultó la creación naive en una variable evaluada 15 líneas después."
      },
      v06: {
        title_en: "Reversed Operands: now() > hold_until",
        title_es: "Operandos invertidos: now() > hold_until",
        type: "Syntax Inversion",
        code: "- if datetime.now() > escrow.hold_until:\n+ if datetime.now(timezone.utc) > escrow.hold_until:",
        semgrep_pattern: "pattern-either:\n  - pattern: $T > $X\n  - pattern: $X < $T",
        explanation_en: "Operand order flipped so naive datetime appears on the left-hand side.",
        explanation_es: "Orden de operandos invertido para que el datetime naive quede en el lado izquierdo."
      }
    }
  },
  connection_leak: {
    id: "connection_leak",
    title_en: "Unbounded DB Pool Leak in Async Context",
    title_es: "Fuga de Conexiones DB en Contexto Asíncrono",
    issue: "#587",
    original_file: "core/database/session.py",
    original_line: 114,
    root_cause_en: "Database connection acquired in async task without try/finally release or async context manager under error branches.",
    root_cause_es: "Conexión a BD adquirida en tarea async sin bloque try/finally ni context manager en ramas de error.",
    why_it_breaks_en: "Connection pool exhausts after 50 handled exceptions, causing HTTP 500 across all subsequent requests.",
    why_it_breaks_es: "El pool de conexiones se agota tras 50 excepciones, arrojando HTTP 500 en todas las peticiones posteriores.",
    twins: [
      {
        id: "c01",
        file: "services/auth/tokens.py",
        line: 88,
        status: "fixed",
        reason_en: "acquire() without context manager in token validation loop",
        reason_es: "acquire() sin context manager en bucle de validación de tokens",
        test_fail_log: "FAILED tests/test_tokens.py::test_pool_saturation - TimeoutError: QueuePool limit exceeded",
        test_pass_log: "PASSED tests/test_tokens.py::test_pool_saturation [100%]"
      },
      {
        id: "c02",
        file: "services/billing/gateway.py",
        line: 195,
        status: "fixed",
        reason_en: "Connection released only in success branch; skipped on payment API error",
        reason_es: "Conexión liberada sólo en rama de éxito; ignorada en error de pasarela",
        test_fail_log: "FAILED tests/test_gateway.py::test_failed_charge_leak - PoolExhaustedError",
        test_pass_log: "PASSED tests/test_gateway.py::test_failed_charge_leak [100%]"
      },
      {
        id: "c03",
        file: "workers/etl/ingest.py",
        line: 42,
        status: "suspected",
        reason_en: "Batch cursor held open across long-running HTTP stream (requires distributed test harness)",
        reason_es: "Cursor batch sostenido durante stream HTTP largo (requiere test distribuido)",
        test_fail_log: "SKIPPED - requires distributed worker harness",
        test_pass_log: "STATUS: Marked as suspected"
      }
    ],
    rounds: [
      {
        round: 0,
        label: "Round 0 (Baseline)",
        score: 20,
        ratio: "1 / 5 caught",
        variants: {
          v01: { state: "detected", detectedBy: ["Base Pool Test"] },
          v02: { state: "escaped", detectedBy: [] },
          v03: { state: "escaped", detectedBy: [] },
          v04: { state: "escaped", detectedBy: [] },
          v05: { state: "escaped", detectedBy: [] },
          v06: { state: "escaped", detectedBy: [] }
        }
      },
      {
        round: 1,
        label: "Round 1",
        score: 60,
        ratio: "3 / 5 caught",
        variants: {
          v01: { state: "detected", detectedBy: ["rule.v1"] },
          v02: { state: "detected", detectedBy: ["rule.v1"] },
          v03: { state: "escaped", detectedBy: [] },
          v04: { state: "detected", detectedBy: ["rule.v1"] },
          v05: { state: "escaped", detectedBy: [] },
          v06: { state: "escaped", detectedBy: [] }
        }
      },
      {
        round: 2,
        label: "Round 2",
        score: 100,
        ratio: "5 / 5 caught (100% Immunity)",
        variants: {
          v01: { state: "detected", detectedBy: ["rule.v2"] },
          v02: { state: "detected", detectedBy: ["rule.v2"] },
          v03: { state: "detected", detectedBy: ["rule.v2"] },
          v04: { state: "detected", detectedBy: ["rule.v2"] },
          v05: { state: "detected", detectedBy: ["rule.v2"] },
          v06: { state: "detected", detectedBy: ["rule.v2"] }
        }
      }
    ],
    variants_info: {
      v01: {
        title_en: "Direct conn = pool.get() without release",
        title_es: "conn = pool.get() directo sin liberación",
        type: "Syntax",
        code: "- conn = await pool.acquire()\n+ async with pool.acquire() as conn:",
        semgrep_pattern: "pattern: $C = await pool.acquire()",
        explanation_en: "Classic unreleased acquire call.",
        explanation_es: "Llamada clásica de adquisición sin bloque de liberación."
      },
      v02: {
        title_en: "Exception in secondary processing loop",
        title_es: "Excepción en bucle de procesamiento secundario",
        type: "Error Branch",
        code: "- conn = await pool.acquire()\n- process_item()\n- await conn.close()\n+ async with pool.acquire(): ...",
        semgrep_pattern: "pattern-not-inside: try: ... finally: ...",
        explanation_en: "Error happens before explicit close() call.",
        explanation_es: "El error ocurre antes de la llamada explícita a close()."
      },
      v03: {
        title_en: "Wrapped connection helper function",
        title_es: "Función auxiliar envoltorio de conexión",
        type: "Indirection",
        code: "- return get_raw_connection()\n+ @asynccontextmanager\n+ async def get_connection(): ...",
        semgrep_pattern: "pattern: return $P.acquire()",
        explanation_en: "Helper returning unmanaged connection reference.",
        explanation_es: "Función auxiliar que retorna referencia no gestionada."
      },
      v04: {
        title_en: "Premature return statement in validation",
        title_es: "Retorno prematuro en bloque de validación",
        type: "Early Return",
        code: "- if not valid: return None\n- await conn.release()",
        semgrep_pattern: "pattern: return ... without release",
        explanation_en: "Branch terminates before reaching cleanup line.",
        explanation_es: "La rama termina antes de llegar a la línea de limpieza."
      },
      v05: {
        title_en: "Nested transaction without savepoint rollback",
        title_es: "Transacción anidada sin rollback de savepoint",
        type: "Nesting",
        code: "- async with conn.transaction(): ...",
        semgrep_pattern: "pattern: nested transaction audit",
        explanation_en: "Sub-transaction leaves parent lock active.",
        explanation_es: "La sub-transacción deja activo el bloqueo del padre."
      },
      v06: {
        title_en: "Generator yielding connection without close",
        title_es: "Generador cediendo conexión sin close",
        type: "Generator",
        code: "- yield conn\n+ async with conn:\n+ yield conn",
        semgrep_pattern: "pattern: yield $C",
        explanation_en: "Generator function aborts if consumer stops iteration.",
        explanation_es: "El generador aborta si el consumidor detiene la iteración."
      }
    }
  }
};

// --- Internationalization Dictionary ---
const I18N = {
  en: {
    nav_problem: "The Problem",
    nav_architecture: "Immune Architecture",
    nav_lab: "Live Lab Simulator",
    nav_proof: "Proof vs Opinion",
    nav_bob: "IBM Bob 2.0",
    nav_roi: "ROI Impact",
    nav_cli: "CLI Quickstart",
    badge_hackathon: "IBM Bob 2.0 Hackathon · September 2026",
    hero_headline: "Your team already paid for every bug. Antibody makes sure you never pay twice.",
    hero_sub: "When a developer fixes a bug, they fix only one copy. Antibody uses IBM Bob 2.0 to hunt the mistake's semantic twins across your repository, proves each one with a failing pytest, and lets autonomous red-team subagents attack custom Semgrep defenses until repository immunity hits 100%.",
    hero_headline_a: "Your team already paid for every bug.",
    hero_headline_b_pre: "Antibody makes sure you",
    hero_headline_b_em: "never pay twice",
    hero_lens_hint: "Move the lens over billing/ — grep sees identical lines, Bob sees twins.",
    btn_try_sim: "Run Live Immune Simulation",
    btn_view_docs: "View Architecture & Contracts",
    trust_proof: "100% Deterministic Proofs",
    trust_proof_sub: "pytest exit code 1 → 0",
    trust_zero_hallucination: "Zero Code Hallucinations",
    trust_zero_hallucination_sub: "recorded_by: antibody-cli",
    trust_gitops: "Pure GitOps Architecture",
    trust_gitops_sub: "0 cloud databases or servers",
    trust_isolation: "100% Worktree Isolation",
    trust_isolation_sub: "Zero working tree pollution",
    lab_tag: "Interactive Lab Demonstration",
    lab_title: "The Repository Immune Response Engine",
    lab_desc: "Experience how IBM Bob 2.0 isolates the root cause, tests semantic twins in parallel, and pits red-team attacks against blue-team Semgrep rules in isolated git worktrees.",
    specimen_label: "Active Specimen:",
    phase_1: "1. Infection",
    phase_2: "2. Antibodies",
    phase_3: "3. Vaccine",
    phase_4: "4. Memory",
    score_label: "Immunity Score",
    round_btn_0: "Round 0 (Baseline)",
    round_btn_1: "Round 1 (v1 Rule)",
    round_btn_2: "Round 2 (Hardened)",
    plate_title: "Variant Attack Wells",
    legend_detected: "Neutralized (Crystal Violet)",
    legend_escaped: "Escaped Variant (Amber)",
    btn_sim_play: "Auto-Simulate Response",
    btn_sim_step: "Next Phase",
    tab_diagnosis: "Infection Diagnosis",
    tab_twins: "Semantic Twins (Red/Green)",
    tab_variants: "Adversarial Red-Team",
    tab_rule: "Hardened Semgrep Rule",
    tab_log: "CLI Evidence Log",
    problem_tag: "The Bug Replay Tax",
    problem_title: "Why Software Teams Repeatedly Pay for the Same Mistakes",
    problem_sub: "Developers fix symptoms in one file. Without semantic repository immunity, identical bugs resurface weeks later in other services.",
    p_card1_title: "Text Search & Grep Are Blind",
    p_card1_desc: "Grep can only match literal tokens. When the same architectural mistake is written with different variable names, operators, or imports, traditional search finds nothing.",
    p_card1_metric: "82% of architectural twin bugs escape grep",
    p_card2_title: "Linters Are Generic & Impersonal",
    p_card2_desc: "Off-the-shelf linters enforce generic style rules. They know nothing about your company's proprietary ORM quirks, multi-tenant boundaries, or custom billing invariant.",
    p_card2_metric: "0% coverage for repo-specific business invariants",
    p_card3_title: "LLM Chatbots Hallucinate Advice",
    p_card3_desc: "Generic AI code assistants guess without executing tests. They generate unverified opinions that developers must manually double-check, adding cognitive fatigue.",
    p_card3_metric: "Unverified AI suggestions waste 4.2h / week",
    phases_tag: "Biological Metaphor Engineered for Code",
    phases_title: "The 4-Phase Immune Loop",
    phase_card1_title: "1. Infection",
    phase_card1_who: "Who: IBM Bob 2.0 (Document Understanding)",
    phase_card1_desc: "Bob ingests the fix diff, commit message, and linked incident postmortems (Markdown, PDF) to extract the abstract root cause: the mistake concept, not the file location.",
    phase_card2_title: "2. Antibodies",
    phase_card2_who: "Who: Bob Subagents + Deterministic CLI",
    phase_card2_desc: "Autonomous subagents hunt twins across the codebase by meaning. A twin is confirmed ONLY when the CLI executes a pytest that fails (red) and subsequent fix passes (green).",
    phase_card3_title: "3. Vaccine",
    phase_card3_who: "Who: Red-Team Subagent vs Blue-Team Bob",
    phase_card3_desc: "A red-team subagent (which never sees the defense) writes realistic mutation attacks in isolated git worktrees. Bob hardens the Semgrep rule until immunity hits 100%.",
    phase_card4_title: "4. Memory",
    phase_card4_who: "Who: GitOps in .antibody/ directory",
    phase_card4_desc: "The hardened rule message preserves the incident context and fix link for future developers. Everything lives in git; no external database or server needed.",
    adv_tag: "Adversarial Self-Training",
    adv_title: "Red Team vs. Blue Team",
    adv_sub: "How Antibody attacks itself until it reaches 100% immunity.",
    adv_intro: "Most tools write a static linter rule and “pray” it works. Antibody uses adversarial game dynamics (self-play), splitting IBM Bob into two autonomous agents that compete against each other blind:",
    adv_red_role: "Attacker subagent",
    adv_red_title: "The Red Team",
    adv_red_p1: "An isolated subagent that never has access to the defense rule.",
    adv_red_p2: "Its only mission is to act like a malicious attacker or a careless developer: it invents tricky mutations of the bug to fool the system — changing operators, using aliases like utcnow(), flipping operands, or hiding the error in helper variables 15 lines later.",
    adv_blue_role: "Bob, the defender",
    adv_blue_title: "The Blue Team",
    adv_blue_p1: "The agent in charge of writing the permanent protection rule in Semgrep.",
    adv_blue_p2: "It doesn't see the attacks in advance either: it must design a robust semantic pattern based purely on the root cause of the problem.",
    adv_blind_label: "Blind to",
    adv_arena_title: "The battle in an isolated git worktree",
    adv_arena_1: "The Antibody CLI applies each mutated attack in a temporary, isolated environment — never touching your working code.",
    adv_arena_2: "It runs Semgrep and the real tests. If a variant slips through unnoticed, it's marked as “Escaped” (Amber alert).",
    adv_arena_3: "With that evidence, Bob analyzes where the bug leaked and hardens the rule round after round (Round 0 → Round 1 → Round 2), until 100% of variants are neutralized and stained Crystal Violet.",
    adv_r0: "Round 0",
    adv_r1: "Round 1",
    adv_r2: "Round 2",
    adv_result: "The result: a defense that wasn't validated by human opinions, but forged under fire against real adversarial mutations.",
    repomap_scroll_hint: "Swipe horizontally to explore full repository map",
    nav_team: "Team",
    team_tag: "The Creators",
    team_title: "Meet the Team Behind Antibody",
    team_desc: "Engineered with precision for the IBM Bob 2.0 Hackathon (September 2026, lablab.ai).",
    team_connect: "LinkedIn Profile ↗",
    team_role_roman: "Full-Stack & Systems Architecture",
    team_desc_roman: "Core architecture, deterministic evidence engine, and interactive laboratory interface.",
    team_role_joaquin: "Autonomous Agents & Logic",
    team_desc_joaquin: "IBM Bob 2.0 subagent orchestration, adversarial red-team mutations, and twin hunter pipelines.",
    team_role_benjamin: "Systems & Verification",
    team_desc_benjamin: "Git worktree sandbox isolation, AST parsing dissector, and deterministic pytest verification.",
    proof_tag: "Anti-Hallucination Philosophy",
    proof_title: "Proof Over Opinion",
    proof_sub: "Antibody refuses to make claims it cannot demonstrate with real compiler or pytest execution.",
    speculative_head: "Generic LLM Code Reviewers",
    speculative_badge: "Unverified Guesses",
    speculative_desc: "Looks at code and generates speculative comments: 'Line 42 might be problematic'. Requires human engineers to manually write repros and investigate false alarms.",
    verified_head: "Antibody with IBM Bob 2.0",
    verified_badge: "Deterministic Red/Green Proof",
    verified_desc: "Never reports a twin it cannot execute. Spawns an isolated subagent that writes a test. The twin is recorded if and only if pytest returns exit code 1 (failing) then 0 (passing).",
    bob_tag: "Powered by IBM Bob 2.0",
    bob_title: "How Antibody Leverages Bob 2.0 Superpowers",
    bob_c1_title: "Multimodal Incident Ingestion",
    bob_c1_desc: "Bob reads fix diffs, GitHub issues, and architecture postmortems (PDF, Word, Markdown) to distill the exact underlying failure pattern.",
    bob_c2_title: "Full Repository Semantic Graph",
    bob_c2_desc: "Bob traverses the entire repository structure, recognizing identical design mistakes even when syntax and variable naming differ completely.",
    bob_c3_title: "Parallel Autonomous Subagents",
    bob_c3_desc: "One subagent per twin candidate proves issues in complete worktree isolation without blocking developer checkouts.",
    bob_c4_title: "Game-Theoretic Self-Play",
    bob_c4_desc: "Bob acts as both Red-Team attacker (writing adversarial variants) and Blue-Team defender (writing Semgrep rules), converging on 100% immunity.",
    gitops_tag: "Zero Infrastructure Overhead",
    gitops_title: "Pure GitOps: Everything Lives in Your Repository",
    gitops_desc: "No SaaS accounts. No third-party data transmission. No database to manage. All evidence, scores, and permanent rules are plain files checked into git and reviewed via standard Pull Requests.",
    roi_tag: "Measured Hackathon Benchmark",
    roi_title: "Proven Impact on Real Codebases",
    roi_col1: "Metric / Capability",
    roi_col2: "Manual Engineering",
    roi_col3: "Antibody with IBM Bob",
    roi_row1: "Time to Hunt Repository Twins",
    roi_row1_val1: "90 minutes (ad-hoc grep)",
    roi_row1_val2: "10 minutes (automated)",
    roi_row2: "Twin Verification Rigor",
    roi_row2_val1: "Subjective human inspection",
    roi_row2_val2: "100% Failing Pytest Proof",
    roi_row3: "Adversarial Stress Testing",
    roi_row3_val1: "None (defenses stay brittle)",
    roi_row3_val2: "Multi-round Red-Team Mutation",
    roi_row4: "Final Immunity Score",
    roi_row4_val1: "17% (baseline only)",
    roi_row4_val2: "100% (proven in worktree)",
    cli_tag: "Developer Experience",
    cli_title: "Simple CLI, Seamless Bob Mode",
    cli_step1_badge: "Step 1",
    cli_step1_title: "Initialize in Any Repository",
    cli_step2_badge: "Step 2",
    cli_step2_title: "Launch from Fix Commit in Bob IDE",
    cli_step3_badge: "Step 3",
    cli_step3_title: "Inspect Visual Scoreboard",
    cta_title: "Stop paying for the same bugs twice.",
    cta_sub: "Equip your repository with an autonomous immune system. Built for the IBM Bob 2.0 Hackathon.",
    cta_btn: "Get Started on GitHub",
    footer_built: "Built for the IBM Bob 2.0 Hackathon (September 2026, lablab.ai).",
    footer_mit: "Released under MIT Open Source License.",
    nav_repomap: "Immune Map",
    nav_microscope: "AST Microscope",
    nav_sandbox: "Live Terminal",
    repomap_tag: "Repository Topology Visualizer",
    repomap_title: "The Living Repo Immune Map",
    repomap_desc: "Watch semantic infection spread silently across services — and how autonomous Bob subagents deploy in parallel to isolate, prove, and immunize each node.",
    map_status_quarantine: "Network State: Vulnerable (3 Unprotected Twins)",
    btn_trigger_infection: "Trigger Infection Pulse",
    btn_deploy_immunity: "Deploy Bob Subagents",
    microscope_tag: "Deep Compiler Inspection",
    microscope_title: "Mutation Microscope: AST Dissector",
    microscope_desc: "Compare how standard text grep sees code vs. how IBM Bob's Abstract Syntax Tree (AST) engine uncovers fatal runtime type mismatches.",
    lens_grep: "Human / Grep View (Blind)",
    lens_ast: "Bob AST Semantic X-Ray (Immune)",
    calc_heading: "Interactive Cost Calculator",
    calc_sub: "Adjust parameters to simulate your team's duplicate bug elimination savings.",
    slider_team_title: "Engineering Team Size:",
    slider_bugs_title: "Critical Bug Fixes / Month:",
    slider_rate_title: "Blended Dev Rate ($ USD / hr):",
    calc_out_money_label: "Annual Engineering Cost Saved",
    calc_out_money_desc: "Based on eliminating duplicate diagnosis and repeated emergency fixes.",
    calc_out_hours_label: "Duplicate Triage Hours Saved",
    calc_out_hours_desc: "Developer hours reclaimed from manual grep and postmortem re-investigation.",
    calc_out_regressions_label: "Silent Twin Bugs Neutralized",
    calc_out_regressions_desc: "Identical semantic errors killed before ever reaching production.",
    calc_out_token_label: "Bob Subagent Efficiency",
    calc_out_token_desc: "Zero tokens burned re-running hallucinated advice. Proof recorded by CLI.",
    sandbox_tag: "Live Interactive Terminal",
    sandbox_title: "Try Antibody CLI & Bob Mode Live",
    sandbox_desc: "Click any command chip below to execute realistic workflows with authentic CLI spinners, isolated worktrees, and pytest verdicts."
  },
  es: {
    nav_problem: "El Problema",
    nav_architecture: "Arquitectura Inmune",
    nav_lab: "Simulador de Laboratorio",
    nav_proof: "Prueba vs Opinión",
    nav_bob: "IBM Bob 2.0",
    nav_roi: "Impacto y ROI",
    nav_cli: "Guía Rápida CLI",
    badge_hackathon: "IBM Bob 2.0 Hackathon · Septiembre 2026",
    hero_headline: "Tu equipo ya pagó por cada bug. Antibody asegura que nunca pagues dos veces.",
    hero_sub: "Cuando un programador arregla un bug, sólo arregla una copia. Antibody usa IBM Bob 2.0 para cazar los 'gemelos' semánticos en todo el repositorio, prueba cada uno con un test que falla en pytest, y activa subagentes de equipo rojo que atacan reglas Semgrep hasta alcanzar 100% de inmunidad.",
    hero_headline_a: "Tu equipo ya pagó por cada bug.",
    hero_headline_b_pre: "Antibody asegura que",
    hero_headline_b_em: "nunca pagues dos veces",
    hero_lens_hint: "Mové la lente sobre billing/ — grep ve líneas idénticas, Bob ve gemelos.",
    btn_try_sim: "Probar Simulación Inmune en Vivo",
    btn_view_docs: "Ver Arquitectura y Contratos",
    trust_proof: "100% Pruebas Deterministas",
    trust_proof_sub: "pytest exit code 1 → 0",
    trust_zero_hallucination: "Cero Alucinaciones de Código",
    trust_zero_hallucination_sub: "recorded_by: antibody-cli",
    trust_gitops: "Arquitectura GitOps Pura",
    trust_gitops_sub: "0 bases de datos o servidores en la nube",
    trust_isolation: "100% Aislamiento en Worktree",
    trust_isolation_sub: "Cero contaminación del working tree",
    lab_tag: "Demostración Interactiva de Laboratorio",
    lab_title: "El Motor de Respuesta Inmune del Repositorio",
    lab_desc: "Experimenta cómo IBM Bob 2.0 aísla la causa raíz, prueba gemelos semánticos en paralelo y enfrenta ataques de equipo rojo contra defensas Semgrep en git worktrees aislados.",
    specimen_label: "Espécimen Activo:",
    phase_1: "1. Infección",
    phase_2: "2. Anticuerpos",
    phase_3: "3. Vacuna",
    phase_4: "4. Memoria",
    score_label: "Puntuación de Inmunidad",
    round_btn_0: "Ronda 0 (Base)",
    round_btn_1: "Ronda 1 (Regla v1)",
    round_btn_2: "Ronda 2 (Blindada)",
    plate_title: "Pozos de Ataque de Variantes",
    legend_detected: "Neutralizado (Violeta Cristal)",
    legend_escaped: "Variante Escapada (Ámbar)",
    btn_sim_play: "Auto-Simular Respuesta",
    btn_sim_step: "Siguiente Fase",
    tab_diagnosis: "Diagnóstico de Infección",
    tab_twins: "Gemelos Semánticos (Red/Green)",
    tab_variants: "Equipo Rojo Adversario",
    tab_rule: "Regla Semgrep Blindada",
    tab_log: "Registro de Evidencia CLI",
    problem_tag: "El Impuesto a la Repetición de Bugs",
    problem_title: "¿Por Qué los Equipos Pagan Repetidamente por los Mismos Errores?",
    problem_sub: "Los desarrolladores corrigen síntomas en un solo archivo. Sin inmunidad semántica, los mismos errores reaparecen semanas después en otros servicios.",
    p_card1_title: "Búsqueda por Texto y Grep Están Ciegos",
    p_card1_desc: "Grep sólo busca coincidencias textuales exactas. Cuando el mismo error arquitectónico se escribe con nombres de variables, operadores o imports distintos, no encuentra nada.",
    p_card1_metric: "82% de los bugs gemelos escapan a grep",
    p_card2_title: "Los Linters Son Genéricos e Impersonales",
    p_card2_desc: "Los linters estándar aplican reglas universales de estilo. Desconocen por completo las particularidades de tu ORM propietario, tus límites multi-tenant o tus reglas de facturación.",
    p_card2_metric: "0% cobertura para invariantes propios del negocio",
    p_card3_title: "Los Chatbots de IA Alucinan Consejos",
    p_card3_desc: "Los asistentes de código con LLM opinan sin ejecutar pruebas. Generan especulaciones no verificadas que los ingenieros deben comprobar a mano, generando fatiga mental.",
    p_card3_metric: "Sugerencias de IA sin probar gastan 4.2h / semana",
    phases_tag: "Metáfora Biológica Adaptada a Compiladores",
    phases_title: "El Ciclo Inmune en 4 Fases",
    phase_card1_title: "1. Infección",
    phase_card1_who: "Quién: IBM Bob 2.0 (Comprensión de Documentos)",
    phase_card1_desc: "Bob analiza el commit del fix, el mensaje y los postmortems vinculados (Markdown, PDF) para extraer la causa raíz abstracta: el error conceptual, no la ubicación.",
    phase_card2_title: "2. Anticuerpos",
    phase_card2_who: "Quién: Subagentes de Bob + CLI Determinista",
    phase_card2_desc: "Subagentes autónomos cazan gemelos por significado en todo el código. Un gemelo se confirma ÚNICAMENTE si la CLI ejecuta un test pytest que falla (rojo) y luego pasa (verde).",
    phase_card3_title: "3. Vacuna",
    phase_card3_who: "Quién: Subagente Red-Team vs Bob Blue-Team",
    phase_card3_desc: "Un subagente de equipo rojo (que jamás ve la defensa) genera mutaciones de ataque en un git worktree aislado. Bob refuerza la regla Semgrep hasta lograr 100% de inmunidad.",
    phase_card4_title: "4. Memoria",
    phase_card4_who: "Quién: GitOps en directorio .antibody/",
    phase_card4_desc: "El mensaje de la regla conserva el contexto del incidente y el link al fix para futuros desarrolladores. Todo vive en git; sin bases de datos externas.",
    adv_tag: "Auto-Entrenamiento Adversarial",
    adv_title: "Red Team vs. Blue Team",
    adv_sub: "Cómo Antibody se auto-ataca a sí mismo hasta alcanzar el 100% de inmunidad.",
    adv_intro: "La mayoría de las herramientas escriben una regla de linter estática y “rezan” para que funcione. Antibody utiliza una dinámica de juego adversarial (self-play) dividiendo a IBM Bob en dos agentes autónomos que compiten entre sí a ciegas:",
    adv_red_role: "Subagente Atacante",
    adv_red_title: "El Equipo Rojo",
    adv_red_p1: "Es un subagente aislado que jamás tiene acceso a la regla de defensa.",
    adv_red_p2: "Su única misión es actuar como un atacante malicioso o un desarrollador descuidado: inventa mutaciones tramposas del bug para intentar engañar al sistema (cambia operadores, usa alias como utcnow(), invierte operandos o esconde el error en variables auxiliares 15 líneas después).",
    adv_blue_role: "Bob Defensor",
    adv_blue_title: "El Equipo Azul",
    adv_blue_p1: "Es el agente encargado de redactar la regla de protección permanente en Semgrep.",
    adv_blue_p2: "Tampoco ve los ataques de antemano: debe diseñar un patrón semántico robusto basado puramente en la causa raíz del problema.",
    adv_blind_label: "A ciegas de",
    adv_arena_title: "La batalla en un git worktree aislado",
    adv_arena_1: "La CLI de Antibody aplica cada ataque mutado en un entorno temporal aislado (sin tocar jamás tu código de trabajo).",
    adv_arena_2: "Corre Semgrep y los tests reales. Si una variante pasa desapercibida, se marca como “Escapada” (Alerta Ámbar).",
    adv_arena_3: "Con esa evidencia, Bob analiza por dónde se filtró el bug y refuerza la regla ronda tras ronda (Ronda 0 → Ronda 1 → Ronda 2), hasta que el 100% de las variantes son neutralizadas y teñidas en Violeta Cristal.",
    adv_r0: "Ronda 0",
    adv_r1: "Ronda 1",
    adv_r2: "Ronda 2",
    adv_result: "El resultado: una defensa que no fue probada por opiniones humanas, sino forjada bajo fuego contra mutaciones adversariales reales.",
    repomap_scroll_hint: "Desliza horizontalmente para explorar el mapa del repositorio",
    nav_team: "Equipo",
    team_tag: "Los Creadores",
    team_title: "Conoce al Equipo Detrás de Antibody",
    team_desc: "Diseñado con precisión para la Hackathon IBM Bob 2.0 (Septiembre 2026, lablab.ai).",
    team_connect: "Perfil de LinkedIn ↗",
    team_role_roman: "Full-Stack y Arquitectura de Sistemas",
    team_desc_roman: "Arquitectura central, motor de evidencia determinista e interfaz interactiva del laboratorio.",
    team_role_joaquin: "Agentes Autónomos y Lógica",
    team_desc_joaquin: "Orquestación de subagentes de IBM Bob 2.0, mutaciones de equipo rojo y pipelines de gemelos.",
    team_role_benjamin: "Sistemas y Verificación",
    team_desc_benjamin: "Aislamiento en sandbox de git worktree, disector AST y verificación determinista en pytest.",
    proof_tag: "Filosofía Anti-Alucinación",
    proof_title: "Prueba por Encima de Opinión",
    proof_sub: "Antibody se niega a emitir diagnósticos que no pueda demostrar con la ejecución real de un compilador o suite de tests.",
    speculative_head: "Revisores de Código LLM Tradicionales",
    speculative_badge: "Especulaciones No Verificadas",
    speculative_desc: "Observa el código y genera comentarios especulativos: 'La línea 42 podría fallar'. Obliga al ingeniero a escribir pruebas a mano para descartar falsas alarmas.",
    verified_head: "Antibody con IBM Bob 2.0",
    verified_badge: "Prueba Determinista Red/Green",
    verified_desc: "Nunca reporta un gemelo que no pueda ejecutar. Despliega un subagente aislado que escribe un test. Se confirma sólo si pytest devuelve código de salida 1 (falla) y luego 0 (éxito).",
    bob_tag: "Potenciado por IBM Bob 2.0",
    bob_title: "Cómo Antibody Maximiza las Capacidades de Bob 2.0",
    bob_c1_title: "Comprensión Multimodal de Incidentes",
    bob_c1_desc: "Bob lee diffs de commits, issues y postmortems de arquitectura (PDF, Word, Markdown) para extraer el patrón de falla exacto.",
    bob_c2_title: "Grafo Semántico del Repositorio Completo",
    bob_c2_desc: "Bob navega toda la arquitectura del código, reconociendo el mismo error conceptual aunque la sintaxis y nombres de variables difieran.",
    bob_c3_title: "Subagentes Autónomos en Paralelo",
    bob_c3_desc: "Un subagente por candidato demuestra el problema en un worktree aislado sin bloquear el trabajo del desarrollador.",
    bob_c4_title: "Juego Adversarial (Auto-Entrenamiento)",
    bob_c4_desc: "Bob actúa como atacante de Equipo Rojo (mutando ataques) y defensor de Equipo Azul (diseñando reglas Semgrep), convergiendo en 100% de inmunidad.",
    gitops_tag: "Cero Sobrecarga de Infraestructura",
    gitops_title: "GitOps Puro: Todo Vive Dentro de Tu Repositorio",
    gitops_desc: "Sin cuentas SaaS. Sin transmisión de datos a terceros. Sin bases de datos para mantener. Toda la evidencia, puntuaciones y reglas permanentes son archivos planos en git revisados por Pull Requests.",
    roi_tag: "Benchmark Medido en la Hackathon",
    roi_title: "Impacto Demostrado en Código Real",
    roi_col1: "Métrica / Capacidad",
    roi_col2: "Ingeniería Manual",
    roi_col3: "Antibody con IBM Bob",
    roi_row1: "Tiempo para cazar gemelos en el repo",
    roi_row1_val1: "90 minutos (grep manual)",
    roi_row1_val2: "10 minutos (automatizado)",
    roi_row2: "Rigor de Verificación de Gemelos",
    roi_row2_val1: "Inspección humana subjetiva",
    roi_row2_val2: "100% Demostrado con Pytest",
    roi_row3: "Pruebas de Estrés Adversariales",
    roi_row3_val1: "Ninguna (defensas frágiles)",
    roi_row3_val2: "Mutación por Equipo Rojo",
    roi_row4: "Puntuación Final de Inmunidad",
    roi_row4_val1: "17% (solo base)",
    roi_row4_val2: "100% (probado en worktree)",
    cli_tag: "Experiencia para Desarrolladores",
    cli_title: "CLI Sencillo, Modo Bob Integrado",
    cli_step1_badge: "Paso 1",
    cli_step1_title: "Inicializar en Cualquier Repositorio",
    cli_step2_badge: "Paso 2",
    cli_step2_title: "Ejecutar desde Commit en Bob IDE",
    cli_step3_badge: "Paso 3",
    cli_step3_title: "Inspeccionar Marcador Visual",
    cta_title: "Dejá de pagar por los mismos bugs dos veces.",
    cta_sub: "Dotá a tu repositorio de un sistema inmune autónomo. Construido para la Hackathon IBM Bob 2.0.",
    cta_btn: "Comenzar en GitHub",
    footer_built: "Construido para la Hackathon IBM Bob 2.0 (Septiembre 2026, lablab.ai).",
    footer_mit: "Distribuido bajo Licencia Abierta MIT.",
    nav_repomap: "Mapa Inmune",
    nav_microscope: "Microscopio AST",
    nav_sandbox: "Terminal en Vivo",
    repomap_tag: "Visualizador de Topología del Repositorio",
    repomap_title: "El Mapa de Red Inmune en Tiempo Real",
    repomap_desc: "Observa cómo la infección se propaga en silencio entre servicios y cómo los subagentes de Bob se despliegan en paralelo para aislar y blindar cada nodo.",
    map_status_quarantine: "Estado de Red: Vulnerable (3 Gemelos Expuestos)",
    btn_trigger_infection: "Pulsar Ola de Infección",
    btn_deploy_immunity: "Desplegar Subagentes de Bob",
    microscope_tag: "Inspección Profunda de Compilador",
    microscope_title: "Microscopio de Mutaciones: Disector AST",
    microscope_desc: "Compara cómo un grep de texto plano ve el código frente al motor de árbol sintáctico (AST) de Bob que revela incompatibilidades de tipos fatales.",
    lens_grep: "Vista Humano / Grep (Ciega)",
    lens_ast: "Rayos X Semánticos AST de Bob (Inmune)",
    calc_heading: "Calculadora Interactiva de Costos",
    calc_sub: "Ajusta las variables para simular el ahorro por eliminación de bugs repetidos.",
    slider_team_title: "Tamaño del Equipo de Ingeniería:",
    slider_bugs_title: "Fixes de Bugs Críticos / Mes:",
    slider_rate_title: "Tarifa Promedio Dev ($ USD / hr):",
    calc_out_money_label: "Costo Anual de Ingeniería Ahorrado",
    calc_out_money_desc: "Basado en eliminar diagnósticos duplicados y fixes de emergencia repetidos.",
    calc_out_hours_label: "Horas de Triage Repetido Ahorradas",
    calc_out_hours_desc: "Horas recuperadas de búsquedas grep manuales y re-investigación de postmortems.",
    calc_out_regressions_label: "Bugs Gemelos Silenciosos Neutralizados",
    calc_out_regressions_desc: "Errores semánticos idénticos eliminados antes de llegar a producción.",
    calc_out_token_label: "Eficiencia de Subagentes de Bob",
    calc_out_token_desc: "Cero tokens desperdiciados en consejos alucinados. Evidencia registrada por CLI.",
    sandbox_tag: "Terminal Interactiva en Vivo",
    sandbox_title: "Probá Antibody CLI y Modo Bob en Vivo",
    sandbox_desc: "Hacé clic en cualquier comando abajo para ver flujos reales con spinners, worktrees aislados y veredictos de pytest."
  }
};

// --- App State ---
let currentLang = "en";
let currentSpecimenKey = "datetime";
let currentRound = 0;
let currentPhase = 1;
let selectedVariantKey = "v01";
let isSimulating = false;
let simInterval = null;

// --- DOM Elements ---
const specimenSelect = document.getElementById("specimen-select");
const scoreVal = document.getElementById("score-val");
const scoreRatio = document.getElementById("score-ratio");
const roundBtns = document.querySelectorAll(".round-btn");
const phaseSteps = document.querySelectorAll(".phase-step");
const wellUnits = document.querySelectorAll(".well-unit");
const simPlayBtn = document.getElementById("sim-play-btn");
const simStepBtn = document.getElementById("sim-step-btn");
const inspectorTabs = document.querySelectorAll(".tab-btn");
const inspectorContent = document.getElementById("inspector-content");
const langToggleBtn = document.getElementById("lang-toggle-btn");
const themeToggleBtn = document.getElementById("theme-toggle-btn");

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  // Theme check
  const savedTheme = document.documentElement.getAttribute("data-theme") || "light";
  updateThemeIcon(savedTheme);

  // Setup Event Listeners
  setupEventListeners();

  // Initial Render
  renderSpecimen();
  renderRound(0);
  renderPhase(1);
  renderInspectorTab("diagnosis");

  // Initialize the 4 WOW Features
  initRepoMap();
  initMicroscope();
  initRoiCalculator();
  initSandboxTerminal();

  // Presentation layer
  initHeroLens();
  initSectionReveal();
  initMagnetic();
  initNavMenu();
});

function setupEventListeners() {
  // Language switcher
  langToggleBtn.addEventListener("click", () => {
    currentLang = currentLang === "en" ? "es" : "en";
    langToggleBtn.querySelector(".lang-text").textContent = currentLang.toUpperCase();
    document.documentElement.lang = currentLang;
    applyLanguage(currentLang);
    renderSpecimen();
    renderInspectorTab("diagnosis");
    if (window.updateMicroscopeLanguage) window.updateMicroscopeLanguage();
  });

  // Theme switcher
  themeToggleBtn.addEventListener("click", () => {
    const curTheme = document.documentElement.getAttribute("data-theme") || "light";
    const nextTheme = curTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", nextTheme);
    try { localStorage.setItem("antibody_theme", nextTheme); } catch (e) {}
    updateThemeIcon(nextTheme);
  });

  // Specimen selection
  specimenSelect.addEventListener("change", (e) => {
    currentSpecimenKey = e.target.value;
    currentRound = 0;
    currentPhase = 1;
    selectedVariantKey = "v01";
    renderSpecimen();
    renderRound(0);
    renderPhase(1);
    renderInspectorTab("diagnosis");
  });

  // Round buttons
  roundBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const r = parseInt(btn.dataset.round, 10);
      currentRound = r;
      currentPhase = r === 0 ? 1 : (r === 1 ? 2 : 3);
      renderRound(r);
      renderPhase(currentPhase);
    });
  });

  // Phase steps
  phaseSteps.forEach(btn => {
    btn.addEventListener("click", () => {
      const p = parseInt(btn.dataset.phase, 10);
      currentPhase = p;
      if (p === 1) currentRound = 0;
      else if (p === 2) currentRound = 1;
      else currentRound = 2;
      renderPhase(p);
      renderRound(currentRound);
      
      const tabMap = { 1: "diagnosis", 2: "twins", 3: "variants", 4: "rule" };
      renderInspectorTab(tabMap[p]);
    });
  });

  // Well plate units
  wellUnits.forEach(well => {
    well.addEventListener("click", () => {
      selectedVariantKey = well.dataset.variant;
      wellUnits.forEach(w => w.classList.remove("active-well"));
      well.classList.add("active-well");
      renderInspectorTab("variants");
    });
  });

  // Inspector Tabs
  inspectorTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      inspectorTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderInspectorTab(tab.dataset.tab);
    });
  });

  // Simulation controls
  simPlayBtn.addEventListener("click", toggleSimulation);
  simStepBtn.addEventListener("click", stepSimulation);

  // Copy buttons
  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const textToCopy = btn.dataset.copy;
      navigator.clipboard.writeText(textToCopy).then(() => {
        const origIcon = btn.innerHTML;
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        setTimeout(() => { btn.innerHTML = origIcon; }, 1800);
      });
    });
  });
}

function updateThemeIcon(theme) {
  themeToggleBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
}

function applyLanguage(lang) {
  const dict = I18N[lang];
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });
  if (isSimulating) {
    simPlayBtn.querySelector(".sim-label").textContent = lang === "es" ? "Pausar Simulación" : "Pause Simulation";
  }
}

function renderSpecimen() {
  const specimen = SPECIMENS[currentSpecimenKey];
  const isEs = currentLang === "es";

  // Update diagnosis header banner if visible
  const diagTitleEl = document.getElementById("diag-banner-title");
  if (diagTitleEl) {
    diagTitleEl.textContent = isEs ? specimen.title_es : specimen.title_en;
  }
  const diagPatternEl = document.getElementById("diag-banner-pattern");
  if (diagPatternEl) {
    diagPatternEl.textContent = isEs ? specimen.root_cause_es : specimen.root_cause_en;
  }
}

function renderRound(roundIdx) {
  const specimen = SPECIMENS[currentSpecimenKey];
  const roundData = specimen.rounds[roundIdx];

  // Update active round button
  roundBtns.forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.dataset.round, 10) === roundIdx);
  });

  // Animate score counter
  animateCounter(scoreVal, roundData.score);
  scoreRatio.textContent = roundData.ratio;

  // Update well plate circles
  wellUnits.forEach(well => {
    const vId = well.dataset.variant;
    const vState = roundData.variants[vId];
    if (vState) {
      well.setAttribute("data-state", vState.state);
      well.classList.add("pop");
      setTimeout(() => well.classList.remove("pop"), 280);
    }
  });

  // If variants tab is active, re-render it
  const activeTab = document.querySelector(".tab-btn.active")?.dataset.tab;
  if (activeTab === "variants") {
    renderInspectorTab("variants");
  }
}

function renderPhase(phaseNum) {
  phaseSteps.forEach(step => {
    const p = parseInt(step.dataset.phase, 10);
    step.classList.toggle("active", p === phaseNum);
    step.classList.toggle("completed", p < phaseNum);
  });
}

function animateCounter(element, target) {
  const start = parseInt(element.textContent, 10) || 0;
  const duration = 400;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = Math.round(start + (target - start) * progress);
    element.textContent = current;
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = target;
    }
  }
  requestAnimationFrame(update);
}

function toggleSimulation() {
  if (isSimulating) {
    clearInterval(simInterval);
    isSimulating = false;
    simPlayBtn.classList.remove("is-playing");
    simPlayBtn.querySelector(".sim-label").textContent = I18N[currentLang].btn_sim_play;
  } else {
    isSimulating = true;
    simPlayBtn.classList.add("is-playing");
    simPlayBtn.querySelector(".sim-label").textContent = currentLang === 'es' ? 'Pausar Simulación' : 'Pause Simulation';
    simInterval = setInterval(() => {
      stepSimulation();
    }, 2400);
  }
}

function stepSimulation() {
  let nextPhase = (currentPhase % 4) + 1;
  currentPhase = nextPhase;
  
  if (nextPhase === 1) {
    currentRound = 0;
    renderInspectorTab("diagnosis");
  } else if (nextPhase === 2) {
    currentRound = 1;
    renderInspectorTab("twins");
  } else if (nextPhase === 3) {
    currentRound = 2;
    renderInspectorTab("variants");
  } else {
    currentRound = 2;
    renderInspectorTab("rule");
  }

  renderPhase(currentPhase);
  renderRound(currentRound);
}

function renderInspectorTab(tabKey) {
  inspectorTabs.forEach(t => t.classList.toggle("active", t.dataset.tab === tabKey));
  const specimen = SPECIMENS[currentSpecimenKey];
  const isEs = currentLang === "es";

  switch (tabKey) {
    case "diagnosis":
      inspectorContent.innerHTML = `
        <div class="diagnosis-banner">
          <div class="diag-title" id="diag-banner-title">${isEs ? specimen.title_es : specimen.title_en}</div>
          <div class="diag-desc" id="diag-banner-pattern">${isEs ? specimen.root_cause_es : specimen.root_cause_en}</div>
        </div>
        
        <div class="code-window">
          <div class="code-window-header">
            <div class="window-dots"><span></span><span></span><span></span></div>
            <div class="window-filename">${specimen.original_file}:${specimen.original_line} · Diff Extraction</div>
          </div>
          <pre class="code-pre"><code><span class="hl-comment"># Bob Document Understanding: Root cause distilled from issue ${specimen.issue}</span>
<span class="hl-keyword">def</span> <span class="hl-func">process_record</span>(invoice):
<span class="line-del">-   if invoice.expires_at < datetime.now():</span>
<span class="line-add">+   if invoice.expires_at < datetime.now(timezone.utc):</span>
        invoice.mark_expired()
        <span class="hl-keyword">return</span> <span class="hl-string">"expired"</span></code></pre>
        </div>

        <div style="margin-top: 18px; font-size: 13px; color: var(--ink-secondary);">
          <b>${isEs ? 'Razón de Ruptura en Runtime:' : 'Why It Breaks at Runtime:'}</b>
          <p style="margin-top: 4px;">${isEs ? specimen.why_it_breaks_es : specimen.why_it_breaks_en}</p>
        </div>
      `;
      break;

    case "twins":
      const twinsHtml = specimen.twins.map(twin => `
        <div class="twin-card">
          <div class="twin-card-info">
            <span class="twin-badge">${twin.id}</span>
            <div>
              <div class="twin-file">${twin.file}:${twin.line}</div>
              <div class="twin-reason">${isEs ? twin.reason_es : twin.reason_en}</div>
            </div>
          </div>
          <div>
            <span class="twin-status-pill status-${twin.status}">${twin.status.toUpperCase()}</span>
          </div>
        </div>
      `).join("");

      inspectorContent.innerHTML = `
        <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-size: 14px; font-weight: 600;">${isEs ? 'Gemelos Semánticos Detectados por Subagentes' : 'Semantic Twins Hunted by Subagents'}</span>
          <span style="font-family: var(--font-mono); font-size: 12px; color: var(--ink-muted);">recorded_by: antibody-cli</span>
        </div>
        <div class="twins-stack">${twinsHtml}</div>
        <div class="code-window" style="margin-top: 20px;">
          <div class="code-window-header">
            <div class="window-dots"><span></span><span></span><span></span></div>
            <div class="window-filename">pytest evidence run · c01 verification</div>
          </div>
          <pre class="code-pre"><code><span class="hl-comment"># Phase RED: Verifying twin existence before touching code</span>
$ antibody prove c01 --phase red
<span style="color: #F87171;">${specimen.twins[0].test_fail_log}</span>
[antibody-cli] VERDICT: Confirmed twin. Real pytest failure verified.

<span class="hl-comment"># Phase GREEN: Minimal fix applied</span>
$ antibody prove c01 --phase green
<span style="color: #4ADE80;">${specimen.twins[0].test_pass_log}</span>
[antibody-cli] VERDICT: Twin neutralized.</code></pre>
        </div>
      `;
      break;

    case "variants":
      const vKey = selectedVariantKey in specimen.variants_info ? selectedVariantKey : "v01";
      const v = specimen.variants_info[vKey];
      const rData = specimen.rounds[currentRound];
      const vState = rData.variants[vKey]?.state || "escaped";

      inspectorContent.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <div>
            <span class="twin-badge">${vKey.toUpperCase()}</span>
            <span style="font-weight: 600; font-size: 15px; margin-left: 8px;">${isEs ? v.title_es : v.title_en}</span>
          </div>
          <span class="twin-status-pill ${vState === 'detected' ? 'status-fixed' : 'status-suspected'}">
            ${vState === 'detected' ? (isEs ? 'NEUTRALIZADO' : 'DETECTED') : (isEs ? 'ESCAPÓ' : 'ESCAPED')}
          </span>
        </div>
        
        <p style="font-size: 13px; color: var(--ink-secondary); margin-bottom: 16px;">
          ${isEs ? v.explanation_es : v.explanation_en}
        </p>

        <div class="code-window">
          <div class="code-window-header">
            <div class="window-dots"><span></span><span></span><span></span></div>
            <div class="window-filename">adversarial_patch/${vKey}.patch · Red-Team Worktree Attack</div>
          </div>
          <pre class="code-pre"><code>${v.code}</code></pre>
        </div>

        <div class="code-window" style="margin-top: 16px;">
          <div class="code-window-header">
            <div class="window-dots"><span></span><span></span><span></span></div>
            <div class="window-filename">semgrep_defense_rule.yml · Blue-Team Pattern</div>
          </div>
          <pre class="code-pre"><code><span class="hl-comment"># Semgrep pattern targeted for this variant</span>
${v.semgrep_pattern}</code></pre>
        </div>
      `;
      break;

    case "rule":
      inspectorContent.innerHTML = `
        <div style="margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600; font-size: 14px;">.antibody/antibodies/001-naive-vs-aware-datetime/rule.yml</span>
          <span class="twin-status-pill status-fixed">VACCINE HARDENED</span>
        </div>
        <div class="code-window">
          <div class="code-window-header">
            <div class="window-dots"><span></span><span></span><span></span></div>
            <div class="window-filename">rule.yml · Permanent Repository Defense</div>
          </div>
          <pre class="code-pre"><code><span class="hl-keyword">rules:</span>
  - <span class="hl-keyword">id:</span> <span class="hl-string">naive-vs-aware-datetime</span>
    <span class="hl-keyword">message:</span> |
      Do not mix naive datetime ($NOW) with timezone-aware datetimes.
      Historical fix: commit a1b2c3d (#412).
      Use datetime.now(timezone.utc) to preserve repo immunity.
    <span class="hl-keyword">severity:</span> <span class="hl-string">ERROR</span>
    <span class="hl-keyword">languages:</span> [<span class="hl-string">python</span>]
    <span class="hl-keyword">pattern-either:</span>
      - <span class="hl-keyword">pattern:</span> $X &lt; datetime.now()
      - <span class="hl-keyword">pattern:</span> datetime.now() &gt; $X
      - <span class="hl-keyword">pattern:</span> ($X - datetime.now()).days
      - <span class="hl-keyword">pattern:</span> datetime.utcnow()
    <span class="hl-keyword">metadata:</span>
      <span class="hl-keyword">immunity_score:</span> <span class="hl-string">1.0</span>
      <span class="hl-keyword">vaccine_rounds:</span> <span class="hl-string">2</span>
      <span class="hl-keyword">generated_by:</span> <span class="hl-string">ibm-bob-2.0</span></code></pre>
        </div>
      `;
      break;

    case "log":
      inspectorContent.innerHTML = `
        <div class="code-window">
          <div class="code-window-header">
            <div class="window-dots"><span></span><span></span><span></span></div>
            <div class="window-filename">.antibody/runs/20260926-101500/timeline.log</div>
          </div>
          <pre class="code-pre"><code>[0.0m] RUN_STARTED: From fix commit a1b2c3d (#412)
[0.9m] DIAGNOSIS: Root cause isolated -> Naive vs aware datetime
[2.1m] CANDIDATES: 5 semantic twins found across repository
[3.2m] TWIN_CONFIRMED: c01 verified with failing pytest (exit code 1)
[3.3m] TWIN_CONFIRMED: c02 verified with failing pytest (exit code 1)
[3.7m] TWIN_CONFIRMED: c03 verified with failing pytest (exit code 1)
[3.9m] TWIN_SUSPECTED: c04 Celery worker untestable in isolation
[4.0m] TWIN_REJECTED: c05 string formatting only
[5.1m] TWIN_FIXED: c01 patch applied -> test is GREEN
[5.2m] TWIN_FIXED: c02 patch applied -> test is GREEN
[5.3m] TWIN_FIXED: c03 patch applied -> test is GREEN
[6.7m] VACCINE_R0: Base immunity 17% (1/6). Escapes: v02, v03, v04, v05, v06
[8.1m] VACCINE_R1: Semgrep rule v1 -> Immunity 50% (3/6). Escapes: v03, v04, v05
[9.6m] VACCINE_R2: Semgrep rule v2 -> Immunity 100% (6/6). Zero escapes!
[10.0m] FINALIZE: Permanent Antibody registered in .antibody/antibodies/
STATUS: RUN COMPLETED IN 10.0 MINUTES (SAVED 80 MIN VS MANUAL BASELINE)</code></pre>
        </div>
      `;
      break;
  }
}

// ==========================================================================
// FEATURE 1: LIVING REPO IMMUNE MAP
// ==========================================================================
function initRepoMap() {
  const triggerBtn = document.getElementById("btn-trigger-infection");
  const deployBtn = document.getElementById("btn-deploy-immunity");
  const statusPill = document.getElementById("repo-network-status");
  const statusText = document.getElementById("repo-network-status-text");
  const drawerTitle = document.getElementById("node-detail-title");
  const drawerStatus = document.getElementById("node-detail-status");
  const drawerHint = document.getElementById("node-detail-hint");

  if (!triggerBtn || !deployBtn) return;

  const nodes = document.querySelectorAll(".repo-node");
  const edges = document.querySelectorAll(".repo-svg-edge");
  const shields = {
    sub: document.getElementById("shield-sub"),
    rem: document.getElementById("shield-rem"),
    web: document.getElementById("shield-web"),
    rep: document.getElementById("shield-rep")
  };

  const nodeInfo = {
    origin: {
      title: "billing/invoices.py:88 (Fix Origin)",
      status: "Root Cause Origin: timezone-aware datetime mixed with naive now()",
      hint: "Commit a1b2c3d addressed this line. Without Antibody, other services remain vulnerable."
    },
    sub: {
      title: "billing/subscriptions.py:142 (Twin c01)",
      status: "Twin Candidate: renews_at compared with naive now()",
      hint: "Proven with failing pytest: TypeError on subscription auto-renew cron."
    },
    rem: {
      title: "billing/reminders.py:57 (Twin c02)",
      status: "Twin Candidate: due_at subtracted from naive utcnow()",
      hint: "Proven with failing pytest: TypeError during customer grace period calculation."
    },
    web: {
      title: "billing/api/webhooks.py:203 (Twin c03)",
      status: "Twin Candidate: received_at with explicit offset",
      hint: "Proven with failing pytest: Inbound payment webhook crashed on timestamp check."
    },
    rep: {
      title: "billing/reports/monthly.py:31 (Suspected c04)",
      status: "Suspected Candidate: Celery worker untestable in isolation",
      hint: "Flagged for manual review. Antibody marks unproven code as suspected, never guessing."
    },
    shield: {
      title: ".antibody/antibodies/001-naive-vs-aware/rule.yml",
      status: "Permanent Repository Shield (100% Immunity)",
      hint: "Hardened Semgrep rule verified by adversarial Red-Team mutation rounds."
    }
  };

  // Node selection handler
  nodes.forEach(node => {
    node.addEventListener("click", () => {
      const id = node.dataset.nodeId;
      if (nodeInfo[id]) {
        drawerTitle.innerHTML = `<b>Node Selected:</b> <span class="font-mono">${nodeInfo[id].title}</span>`;
        drawerStatus.innerHTML = `<b>Status:</b> <span class="font-mono" style="color: ${node.classList.contains('immunized') ? 'var(--proof-green)' : 'var(--escape-amber)'};">${nodeInfo[id].status}</span>`;
        drawerHint.textContent = nodeInfo[id].hint;
      }
    });
  });

  // Trigger Infection
  triggerBtn.addEventListener("click", () => {
    edges.forEach(e => {
      e.classList.remove("immunized");
      e.classList.add("infected");
    });
    nodes.forEach(n => {
      if (n.dataset.nodeId !== "origin" && n.dataset.nodeId !== "shield") {
        n.classList.remove("immunized");
        n.classList.add("infected");
      }
    });
    Object.values(shields).forEach(s => { if (s) s.style.display = "none"; });

    statusPill.className = "map-status-pill status-quarantine";
    statusText.textContent = currentLang === "es" ? "Estado de Red: Vulnerable (3 Gemelos Expuestos)" : "Network State: Vulnerable (3 Unprotected Twins)";
    drawerStatus.innerHTML = `<b>Status:</b> <span class="font-mono" style="color: var(--alert-red);">${currentLang === "es" ? "Ola de Infección Detectada en 3 módulos" : "Infection Outbreak: Semantic twins active"}</span>`;
    drawerHint.textContent = currentLang === "es" ? "Haz clic en 'Desplegar Subagentes de Bob' para aislar cada servicio y aplicar la vacuna." : "Click 'Deploy Bob Subagents' to isolate each service and deploy vaccines.";
  });

  // Deploy Immunity
  deployBtn.addEventListener("click", () => {
    drawerHint.textContent = currentLang === "es" ? "Desplegando subagentes de Bob en worktrees aislados..." : "Deploying Bob subagents across isolated git worktrees...";
    
    setTimeout(() => {
      const subNode = document.querySelector('[data-node-id="sub"]');
      if (subNode) {
        subNode.classList.remove("infected");
        subNode.classList.add("immunized");
        if (shields.sub) shields.sub.style.display = "flex";
      }
    }, 400);

    setTimeout(() => {
      const remNode = document.querySelector('[data-node-id="rem"]');
      if (remNode) {
        remNode.classList.remove("infected");
        remNode.classList.add("immunized");
        if (shields.rem) shields.rem.style.display = "flex";
      }
    }, 800);

    setTimeout(() => {
      const webNode = document.querySelector('[data-node-id="web"]');
      if (webNode) {
        webNode.classList.remove("infected");
        webNode.classList.add("immunized");
        if (shields.web) shields.web.style.display = "flex";
      }
    }, 1200);

    setTimeout(() => {
      const repNode = document.querySelector('[data-node-id="rep"]');
      if (repNode) {
        if (shields.rep) shields.rep.style.display = "flex";
      }
    }, 1600);

    setTimeout(() => {
      edges.forEach(e => {
        e.classList.remove("infected");
        e.classList.add("immunized");
      });
      statusPill.className = "map-status-pill status-immune";
      statusText.textContent = currentLang === "es" ? "Estado de Red: 100% Inmunizado (Semgrep Blindado)" : "Network State: 100% Immunized (Hardened Semgrep Shield)";
      drawerStatus.innerHTML = `<b>Status:</b> <span class="font-mono" style="color: var(--proof-green);">${currentLang === "es" ? "Repositorio Blindado: Cero Gemelos Restantes" : "Repository Immunized: Zero Twins Escaped"}</span>`;
      drawerHint.textContent = currentLang === "es" ? "Regla Semgrep permanente registrada en .antibody/antibodies/001-naive-vs-aware/rule.yml" : "Permanent Semgrep defense rule registered in .antibody/antibodies/";
    }, 2000);
  });
}

// ==========================================================================
// FEATURE 2: MUTATION MICROSCOPE (AST DISSECTOR)
// ==========================================================================
function initMicroscope() {
  const btnGrep = document.getElementById("lens-mode-grep");
  const btnAst = document.getElementById("lens-mode-ast");
  const codeBlock = document.getElementById("microscope-code-block");
  const explanation = document.getElementById("microscope-explanation-text");
  const diagram = document.getElementById("ast-diagram-view");
  const badge = document.getElementById("ast-scan-badge");

  if (!btnGrep || !btnAst) return;

  let currentMode = "ast";

  function setMode(mode) {
    currentMode = mode;
    const isEs = currentLang === "es";
    if (mode === "grep") {
      btnGrep.classList.add("active");
      btnAst.classList.remove("active");
      badge.textContent = isEs ? "CIEGO A TIPOS" : "TYPE-BLIND";
      badge.className = "twin-badge status-suspected";

      codeBlock.innerHTML = `<span class="hl-keyword">def</span> <span class="hl-func">check_renewal</span>(sub):
    <span class="hl-comment"># Grep matches text token 'datetime.now()'</span>
    <span style="background: rgba(245, 158, 11, 0.18); display: inline-block; min-width: calc(100% + 32px); margin: 0 -16px; padding: 0 16px;">    <span class="hl-keyword">if</span> sub.renews_at &lt; <span style="color: #FBBF24; text-decoration: underline;">datetime.now()</span>:</span>
        sub.trigger_billing_cycle()
        <span class="hl-keyword">return</span> <span class="hl-string">"renewed"</span>`;

      explanation.innerHTML = isEs
        ? `<b>Falla de Grep:</b> Grep sólo sabe comparar cadenas literales. Desconoce si <code>sub.renews_at</code> viene de PostgreSQL como datetime con o sin zona horaria. Si un programador escribe <code>sub.renews_at - now()</code> o usa <code>utcnow()</code>, grep devuelve <b>0 resultados</b> y el bug revienta en producción.`
        : `<b>Why Text Grep Fails:</b> Grep only matches exact token strings. It cannot inspect whether <code>sub.renews_at</code> carries timezone metadata from the database driver. When mutated to <code>sub.renews_at - now()</code> or <code>utcnow()</code>, grep returns <b>zero hits</b> and the regression crashes production.`;

      diagram.innerHTML = `<span class="hl-comment"># Flat Token Stream (Zero Context)</span>
[TOKEN: "if"] ──► [TOKEN: "sub.renews_at"] ──► [TOKEN: "&lt;"] ──► [TOKEN: "datetime.now()"]
<span style="color: #F87171;">[!] Type Invariant: UNKNOWN</span>
<span style="color: #F87171;">[!] Semantic Context: NONE</span>
<span style="color: #F87171;">[!] Grep Verdict: False Negative (Bug escapes)</span>`;
    } else {
      btnAst.classList.add("active");
      btnGrep.classList.remove("active");
      badge.textContent = isEs ? "DETECCIÓN SEMÁNTICA" : "SEMANTIC MATCH";
      badge.className = "twin-badge status-fixed";

      codeBlock.innerHTML = `<span class="hl-keyword">def</span> <span class="hl-func">check_renewal</span>(sub):
    <span class="hl-comment"># Bob AST Analyzer tracks dataflow taint</span>
    <span style="background: rgba(122, 46, 142, 0.22); display: inline-block; min-width: calc(100% + 32px); margin: 0 -16px; padding: 0 16px;">    <span class="hl-keyword">if</span> <span style="color: #4ADE80; font-weight: 700;">sub.renews_at</span> <span class="hl-keyword">&lt;</span> <span style="color: #F87171; font-weight: 700;">datetime.now()</span>:</span>
        sub.trigger_billing_cycle()
        <span class="hl-keyword">return</span> <span class="hl-string">"renewed"</span>`;

      explanation.innerHTML = isEs
        ? `<b>Inmunidad Semántica de Bob:</b> El analizador AST de Bob navega el árbol sintáctico. Reconoce que <code>renews_at</code> es un objeto <code>Datetime(tz=UTC)</code> consciente, mientras que <code>now()</code> es naive. Inyecta la regla Semgrep que previene cualquier combinación de estos operandos en todo el repo.`
        : `<b>Bob Semantic Immunity:</b> Bob’s AST engine builds a typed dependency graph. It detects that <code>renews_at</code> evaluates to an aware <code>Datetime(tz=UTC)</code>, whereas <code>now()</code> is naive. It crafts a Semgrep pattern that neutralizes any arithmetic or comparison between them across all files.`;

      diagram.innerHTML = `<span class="hl-keyword">[Compare: BinaryOp (&lt;)]</span>
├── Left:  <span class="ast-aware">[Attribute: sub.renews_at]</span>  ──► Type: Datetime(tz=UTC) <span style="color: #4ADE80;">[AWARE]</span>
└── Right: <span class="ast-naive">[Call: datetime.now()]</span>      ──► Type: Datetime(tz=None) <span style="color: #F87171;">[NAIVE]</span>
<span class="ast-callout">⚠️ TypeError: can't compare offset-naive and offset-aware datetimes</span>
<span style="color: #A7F3D0; font-weight: 600;">✓ Invariant Blocked by Antibody Semgrep Defense Rule</span>`;
    }
  }

  btnGrep.addEventListener("click", () => setMode("grep"));
  btnAst.addEventListener("click", () => setMode("ast"));
  window.updateMicroscopeLanguage = () => setMode(currentMode);
  setMode("ast");
}

// ==========================================================================
// FEATURE 3: FINANCIAL & ENGINEERING ROI CALCULATOR
// ==========================================================================
function initRoiCalculator() {
  const teamInput = document.getElementById("input-team-size");
  const bugsInput = document.getElementById("input-bugs-month");
  const rateInput = document.getElementById("input-dev-rate");

  const teamDisplay = document.getElementById("val-team-size");
  const bugsDisplay = document.getElementById("val-bugs-month");
  const rateDisplay = document.getElementById("val-dev-rate");

  const outMoney = document.getElementById("out-money-saved");
  const outHours = document.getElementById("out-hours-saved");
  const outRegressions = document.getElementById("out-regressions-stopped");

  if (!teamInput || !bugsInput || !rateInput) return;

  function recalculate() {
    const team = parseInt(teamInput.value, 10);
    const bugs = parseInt(bugsInput.value, 10);
    const rate = parseInt(rateInput.value, 10);

    [teamInput, bugsInput, rateInput].forEach(el => {
      const pct = ((el.value - el.min) / (el.max - el.min)) * 100;
      el.style.setProperty("--p", pct + "%");
    });

    teamDisplay.textContent = `${team} devs`;
    bugsDisplay.textContent = `${bugs} fixes`;
    rateDisplay.textContent = `$${rate} / hr`;

    const annualBugs = bugs * 12;
    const annualTwins = Math.max(1, Math.round(annualBugs * 0.25));
    const hoursSaved = annualTwins * 24;
    const moneySaved = hoursSaved * rate;
    const outagesStopped = Math.max(1, Math.round(annualTwins * 0.75));

    outMoney.textContent = `$${moneySaved.toLocaleString()}`;
    outHours.textContent = `${hoursSaved.toLocaleString()} hrs`;
    outRegressions.textContent = `${outagesStopped} bugs`;
  }

  teamInput.addEventListener("input", recalculate);
  bugsInput.addEventListener("input", recalculate);
  rateInput.addEventListener("input", recalculate);
  recalculate();
}

// ==========================================================================
// FEATURE 4: "TRY BOB LIVE" INTERACTIVE SANDBOX TERMINAL
// ==========================================================================
function initSandboxTerminal() {
  const chips = document.querySelectorAll(".sandbox-chips-row .terminal-chip");
  const typedCmd = document.getElementById("terminal-typed-cmd");
  const cmdResult = document.getElementById("terminal-cmd-result");

  if (!chips.length || !typedCmd || !cmdResult) return;

  const cmdData = {
    init: {
      cmd: "antibody init",
      lines: [
        { text: "[antibody] Initializing repository immunity...", color: "#93C5FD" },
        { text: "[antibody] Created .antibody/config.json (budgets: 10 candidates, 6 variants, 3 rounds)", color: "#E2E8F0" },
        { text: "[antibody] Installed custom Bob mode into .bob/custom_modes.yaml", color: "#E2E8F0" },
        { text: "[antibody] Registered slash command /antibody in .bob/commands/antibody.md", color: "#E2E8F0" },
        { text: "✓ Repository primed for IBM Bob 2.0 autonomous immune response.", color: "#4ADE80", bold: true }
      ]
    },
    new: {
      cmd: "antibody new --commit a1b2c3d",
      lines: [
        { text: "[antibody] Reading commit a1b2c3d and linked issue #412...", color: "#93C5FD" },
        { text: "[antibody] Ingesting fix diff: billing/invoices.py:88", color: "#E2E8F0" },
        { text: "[antibody] Bob Abstract Root Cause: Naive datetime.now() mixed with aware DB column", color: "#FBBF24" },
        { text: "[antibody] Hunting repository twins with parallel Bob subagents...", color: "#E2E8F0" },
        { text: "[antibody] Generated candidates.json: 5 semantic twin candidates located.", color: "#4ADE80", bold: true }
      ]
    },
    prove: {
      cmd: "antibody prove c01 --phase red",
      lines: [
        { text: "[antibody] Running isolated pytest verification for candidate c01...", color: "#93C5FD" },
        { text: ">> pytest tests/test_subscriptions.py::test_renewal_check", color: "#E2E8F0" },
        { text: "FAILED: TypeError: can't compare offset-naive and offset-aware datetimes", color: "#F87171", bold: true },
        { text: "[antibody-cli] VERDICT: Confirmed twin with real failing test (exit code 1).", color: "#4ADE80" },
        { text: ">> Proof recorded in .antibody/runs/20260926-101500/verdicts/c01.json", color: "#8FA1A9" }
      ]
    },
    vaccine: {
      cmd: "antibody vaccine --round 2",
      lines: [
        { text: "[antibody] Round 2: Adversarial Red-Team attacking Semgrep rule.v2.yml...", color: "#93C5FD" },
        { text: "[antibody] Spawning 6 adversarial mutagens in isolated git worktree...", color: "#E2E8F0" },
        { text: "  - v01 (Original comparison): CAUGHT by rule [✓]", color: "#4ADE80" },
        { text: "  - v02 (Relocated in refunds): CAUGHT by rule [✓]", color: "#4ADE80" },
        { text: "  - v03 (Arithmetic subtraction): CAUGHT by rule [✓]", color: "#4ADE80" },
        { text: "  - v04 (API alias utcnow): CAUGHT by rule [✓]", color: "#4ADE80" },
        { text: "  - v05 (Variable indirection): CAUGHT by rule [✓]", color: "#4ADE80" },
        { text: "  - v06 (Reversed operands): CAUGHT by rule [✓]", color: "#4ADE80" },
        { text: "IMMUNITY SCORE: 100% (6/6 variants neutralized). Zero escapes.", color: "#A7F3D0", bold: true }
      ]
    },
    scoreboard: {
      cmd: "antibody scoreboard",
      lines: [
        { text: "[antibody] Aggregating deterministic evidence across all phases...", color: "#93C5FD" },
        { text: "[antibody] Twins confirmed & fixed: 3/3 (c01, c02, c03)", color: "#4ADE80" },
        { text: "[antibody] Candidates suspected / rejected: 2 (c04 suspected, c05 rejected)", color: "#FBBF24" },
        { text: "[antibody] Final Immunity Score: 100.0% (Vaccine hardened across 2 rounds)", color: "#A7F3D0" },
        { text: "Visual report ready: Open http://localhost:8000/ui/scoreboard.html", color: "#FFFFFF", bold: true }
      ]
    }
  };

  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      const key = chip.dataset.cmd;
      const data = cmdData[key];
      if (!data) return;

      // Animate typing
      typedCmd.textContent = "";
      cmdResult.innerHTML = `<span style="color: #8FA1A9;">⠋ Executing deterministic evidence runner...</span>`;

      let i = 0;
      const timer = setInterval(() => {
        if (i < data.cmd.length) {
          typedCmd.textContent += data.cmd.charAt(i);
          i++;
        } else {
          clearInterval(timer);
          setTimeout(() => {
            cmdResult.innerHTML = data.lines.map(line => `
              <div style="color: ${line.color}; ${line.bold ? 'font-weight: 700;' : ''}">${line.text}</div>
            `).join("");
          }, 200);
        }
      }, 25);
    });
  });
}

// ==========================================================================
// PRESENTATION: HERO MICROSCOPE LENS
// A stained copy of the repository sits under the dark slide; the lens
// reveals it. Outside the lens every line looks alike (what grep sees);
// inside it, semantic twins take the crystal-violet stain.
// ==========================================================================
function initHeroLens() {
  const frame = document.querySelector("#hero-slide .slide-frame");
  const baseCode = document.getElementById("slide-code");
  const stainLayer = frame && frame.querySelector(".slide-stain");
  const readout = document.getElementById("lens-readout");
  if (!frame || !baseCode || !stainLayer) return;

  const stainCode = baseCode.cloneNode(true);
  stainCode.removeAttribute("id");
  stainLayer.appendChild(stainCode);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const twinLines = Array.from(stainCode.querySelectorAll("[data-twin]"));
  let w = 0, h = 0, r = 110, lines = [];
  let x = 0, y = 0, tx = 0, ty = 0;
  let pointerActive = false, visible = true, raf = 0, lastLabel = "";
  const t0 = performance.now();

  function measure() {
    const box = frame.getBoundingClientRect();
    w = box.width; h = box.height;
    r = Math.max(64, Math.min(130, Math.min(w, h) * 0.24));
    frame.style.setProperty("--r", r + "px");
    lines = twinLines.map(el => {
      const b = el.getBoundingClientRect();
      return { y: b.top - box.top + b.height / 2, label: el.dataset.twin };
    });
  }

  function idleTarget(now) {
    if (reduceMotion) {
      const first = lines[0];
      return [w * 0.42, first ? first.y : h * 0.4];
    }
    const t = (now - t0) / 1000;
    return [w * (0.5 + 0.3 * Math.sin(t * 0.42)), h * (0.5 + 0.34 * Math.sin(t * 0.67 + 1.2))];
  }

  function paint() {
    frame.style.setProperty("--x", x.toFixed(1) + "px");
    frame.style.setProperty("--y", y.toFixed(1) + "px");
    let label = "—";
    let best = r * 0.55;
    lines.forEach(l => {
      const d = Math.abs(l.y - y);
      if (d < best) { best = d; label = l.label; }
    });
    if (label !== lastLabel && readout) { readout.textContent = label; lastLabel = label; }
  }

  function tick(now) {
    if (!pointerActive) [tx, ty] = idleTarget(now);
    const k = reduceMotion ? 1 : 0.12;
    x += (tx - x) * k;
    y += (ty - y) * k;
    paint();
    raf = visible ? requestAnimationFrame(tick) : 0;
  }

  function onPointer(e) {
    const box = frame.getBoundingClientRect();
    pointerActive = true;
    tx = Math.max(0, Math.min(w, e.clientX - box.left));
    ty = Math.max(0, Math.min(h, e.clientY - box.top));
  }

  frame.addEventListener("pointermove", onPointer);
  frame.addEventListener("pointerdown", onPointer);
  frame.addEventListener("pointerleave", () => { pointerActive = false; });
  window.addEventListener("resize", measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(tick);
  }).observe(frame);

  measure();
  [x, y] = idleTarget(performance.now());
  tx = x; ty = y;
  raf = requestAnimationFrame(tick);
}

// Section headers: the rule draws in, then the title rises through it.
function initSectionReveal() {
  const heads = document.querySelectorAll(".sec-head, .arena-track");
  if (!("IntersectionObserver" in window)) {
    heads.forEach(h => h.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -12% 0px" });
  heads.forEach(h => io.observe(h));
}

// Primary CTAs lean toward the cursor (fine pointers only).
function initMagnetic() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll(".magnetic").forEach(el => {
    el.addEventListener("pointermove", e => {
      const b = el.getBoundingClientRect();
      const dx = e.clientX - (b.left + b.width / 2);
      const dy = e.clientY - (b.top + b.height / 2);
      el.style.transform = `translate(${dx * 0.18}px, ${dy * 0.28}px)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });
}

// Section menu (<details>): close after choosing a link, on Escape, or on outside click.
function initNavMenu() {
  const menu = document.querySelector(".nav-menu");
  if (!menu) return;
  const close = () => { menu.open = false; };
  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", close));
  document.addEventListener("keydown", e => { if (e.key === "Escape" && menu.open) close(); });
  document.addEventListener("click", e => { if (menu.open && !menu.contains(e.target)) close(); });
}
