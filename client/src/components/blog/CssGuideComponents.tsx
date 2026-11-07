import React from 'react';

export function CssSubjectsTable() {
  const compulsoryRows = [
    { code: 'Paper I', name: 'English Essay', marks: 100, pass: '40%', focus: '2,500–3,000 word analytical essay. Tests thesis formulation, coherent outline, balanced argumentation, and language accuracy.' },
    { code: 'Paper II', name: 'English Precis & Composition', marks: 100, pass: '40%', focus: 'Precis writing (20 marks), reading comprehension (20 marks), grammar, sentence correction, vocabulary in context, idioms, and translation.' },
    { code: 'Paper III', name: 'General Science & Ability (GSA)', marks: 100, pass: 'GK Aggregate*', focus: 'Part I: General Science (60 marks: Physical, Biological, Environmental, Food sciences, IT); Part II: General Ability (40 marks: Quantitative ability, reasoning, logic).' },
    { code: 'Paper IV', name: 'Current Affairs', marks: 100, pass: 'GK Aggregate*', focus: 'Pakistan’s domestic political and economic issues, foreign relations, regional geopolitics, climate change, and contemporary global developments.' },
    { code: 'Paper V', name: 'Pakistan Affairs', marks: 100, pass: 'GK Aggregate*', focus: 'Ideological foundation, freedom movement, post-1947 constitutional and political evolution, civil-military dynamics, and modern challenges.' },
    { code: 'Paper VI', name: 'Islamic Studies / Comparative Religions', marks: 100, pass: '40%', focus: 'Islamic concept of state, governance, human rights, contemporary challenges, or Comparative Study of Major Religions for non-Muslim candidates.' },
  ];

  const optionalGroups = [
    { group: 'Group 1', max: 'Max 200 marks', list: 'Accountancy & Auditing (200), Economics (200), Computer Science (200), Political Science (200), International Relations (200).' },
    { group: 'Group 2', max: 'Max 200 marks', list: 'Physics (200), Chemistry (200), Applied Mathematics (100), Pure Mathematics (100), Statistics (100), Geology (100).' },
    { group: 'Group 3', max: 'Max 100 marks', list: 'Business Administration (100), Public Administration (100), Governance & Public Policies (100), Town Planning & Urban Management (100).' },
    { group: 'Group 4', max: 'Max 100 marks', list: 'History of Pakistan & India (100), Islamic History & Culture (100), British History (100), European History (100), History of USA (100).' },
    { group: 'Group 5', max: 'Max 100 marks', list: 'Gender Studies (100), Environmental Sciences (100), Agriculture & Forestry (100), Botany (100), Zoology (100), English Literature (100), Urdu Literature (100).' },
    { group: 'Group 6', max: 'Max 100 marks', list: 'Law (100), Constitutional Law (100), International Law (100), Muslim Law & Jurisprudence (100), Mercantile Law (100), Criminology (100), Philosophy (100).' },
    { group: 'Group 7', max: 'Max 100 marks', list: 'Journalism & Mass Communication (100), Psychology (100), Geography (100), Sociology (100), Anthropology (100), Regional Languages (Punjabi, Sindhi, Pashto, Balochi, Persian, Arabic - 100 each).' },
  ];

  return (
    <div className="mt-6 space-y-6">
      {/* Compulsory Table */}
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead style={{ background: 'var(--color-surface-muted)' }}>
            <tr>
              <th className="px-4 py-3 font-bold" style={{ color: 'var(--color-text-primary)' }}>Paper</th>
              <th className="px-4 py-3 font-bold" style={{ color: 'var(--color-text-primary)' }}>Compulsory Subject</th>
              <th className="px-4 py-3 font-bold" style={{ color: 'var(--color-text-primary)' }}>Marks</th>
              <th className="px-4 py-3 font-bold" style={{ color: 'var(--color-text-primary)' }}>Pass Criteria</th>
              <th className="px-4 py-3 font-bold" style={{ color: 'var(--color-text-primary)' }}>Syllabus Focus</th>
            </tr>
          </thead>
          <tbody>
            {compulsoryRows.map((row) => (
              <tr key={row.code} className="border-t align-top" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-4 py-3 font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>{row.code}</td>
                <td className="px-4 py-3 font-semibold" style={{ color: 'var(--color-text-primary)' }}>{row.name}</td>
                <td className="px-4 py-3 font-bold" style={{ color: 'var(--color-accent-text)' }}>{row.marks}</td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{row.pass}</td>
                <td className="px-4 py-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{row.focus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
        *Note on General Knowledge papers: Under official FPSC rules, Papers III, IV, and V (General Science & Ability, Current Affairs, and Pakistan Affairs) are considered General Knowledge papers. Candidates must secure a minimum aggregate of 120 marks out of 300 across these three papers, rather than requiring 40% individually in each, provided the overall written examination criteria are met.
      </p>

      {/* Optional Groups Table */}
      <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Optional Subjects Grouping (600 Marks Total)</h3>
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead style={{ background: 'var(--color-surface-muted)' }}>
            <tr>
              <th className="px-4 py-3 font-bold" style={{ color: 'var(--color-text-primary)' }}>Group</th>
              <th className="px-4 py-3 font-bold" style={{ color: 'var(--color-text-primary)' }}>Selection Rule</th>
              <th className="px-4 py-3 font-bold" style={{ color: 'var(--color-text-primary)' }}>Available Subjects (Marks)</th>
            </tr>
          </thead>
          <tbody>
            {optionalGroups.map((g) => (
              <tr key={g.group} className="border-t align-top" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-4 py-3 font-bold" style={{ color: 'var(--color-text-primary)' }}>{g.group}</td>
                <td className="px-4 py-3 font-semibold text-xs" style={{ color: 'var(--color-accent-text)' }}>{g.max}</td>
                <td className="px-4 py-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{g.list}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border p-4 text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-muted)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Written Examination</p>
          <p className="mt-1 text-2xl font-black" style={{ color: 'var(--color-text-primary)' }}>1,200 Marks</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>600 Compulsory + 600 Optional (Min 50% aggregate to qualify)</p>
        </div>
        <div className="rounded-xl border p-4 text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-muted)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Viva Voce / Interview</p>
          <p className="mt-1 text-2xl font-black" style={{ color: 'var(--color-text-primary)' }}>300 Marks</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>FPSC Board Interview (Min 100 marks / 33.3% to qualify)</p>
        </div>
        <div className="rounded-xl border p-4 text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-muted)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Total Merit Benchmark</p>
          <p className="mt-1 text-2xl font-black" style={{ color: 'var(--color-accent-text)' }}>1,500 Marks</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>Determines final allocation among the 12 occupational groups</p>
        </div>
      </div>
    </div>
  );
}

export function CssTimetableComparison() {
  const studentSchedule = [
    { time: '06:30 AM – 07:30 AM', focus: 'Newspaper Analysis', detail: 'Read Dawn or The News opinion/editorial pages. Extract 1 core national or global issue and write 3 summary bullets.' },
    { time: 'Afternoon / Commute', focus: 'Vocabulary & Micro-Learning', detail: 'Review 5 new vocabulary words in context, listen to an authentic geopolitics/economics podcast, or read an editorial.' },
    { time: '06:00 PM – 07:30 PM', focus: 'Compulsory Subject Study', detail: 'Dedicated textbook reading for Pakistan Affairs, Current Affairs, or General Science & Ability.' },
    { time: '07:45 PM – 09:15 PM', focus: 'Optional Subject Preparation', detail: 'Deep dive into 1 chosen optional subject following the official syllabus outline and recommended texts.' },
    { time: '09:30 PM – 10:15 PM', focus: 'Daily English Writing Practice', detail: 'Write 1 precis paragraph, draft an essay outline, or practice analytical typing on Typeoye to reinforce sentence flow.' },
  ];

  const fulltimeSchedule = [
    { time: '08:00 AM – 09:30 AM', focus: 'Strategic Daily Reading', detail: 'Comprehensive editorial study from Dawn, foreign analysis (Foreign Affairs/The Economist), and issue dossier updating.' },
    { time: '10:00 AM – 12:30 PM', focus: 'Session 1: Core Compulsory Subject', detail: 'Syllabus-focused study of Pakistan Affairs, Current Affairs, or Islamic Studies with structured note-taking.' },
    { time: '02:00 PM – 04:00 PM', focus: 'Session 2: Optional Subject Deep Dive', detail: 'Intensive reading of primary texts for optional subjects (e.g. Political Science, IR, Criminology, US History).' },
    { time: '04:30 PM – 06:00 PM', focus: 'Session 3: General Science & Ability', detail: 'Alternate between General Science concepts (environmental/physical) and quantitative ability mathematical problem-solving.' },
    { time: '07:30 PM – 09:00 PM', focus: 'Session 4: Past Paper Question Practice', detail: 'Timed answer writing: answer 1 question in 35 minutes, complete with headings, quotations, and flow diagrams.' },
    { time: '09:15 PM – 10:00 PM', focus: 'Daily English Writing & Review', detail: 'Draft 1 precis, practice vocabulary in original sentences, or complete an essay outline with a clear thesis statement.' },
  ];

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Student / Working Timetable */}
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--color-border)' }}>
            <h4 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Plan A: University Student / Working Professional</h4>
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-600">4.5 – 5.5 Hours Daily</span>
          </div>
          <ul className="mt-4 space-y-3">
            {studentSchedule.map((item, idx) => (
              <li key={idx} className="border-l-2 pl-3" style={{ borderColor: 'var(--color-accent-text)' }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-accent-text)' }}>{item.time} • {item.focus}</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{item.detail}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Full-time Aspirant Timetable */}
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--color-border)' }}>
            <h4 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Plan B: Full-Time CSS Aspirant</h4>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600">7.5 – 8.5 Hours Daily</span>
          </div>
          <ul className="mt-4 space-y-3">
            {fulltimeSchedule.map((item, idx) => (
              <li key={idx} className="border-l-2 pl-3" style={{ borderColor: '#10b981' }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#10b981' }}>{item.time} • {item.focus}</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{item.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
        Tip: Quality of focused attention always beats counting exhausted clock hours. Take mandatory 10-minute pauses between study blocks and protect at least 7 hours of restorative sleep every night.
      </p>
    </div>
  );
}

export function CssPreparationPlans() {
  const twelveMonthRoadmap = [
    { phase: 'Months 1–3', title: 'Foundation & English Mastery', points: ['Detailed FPSC syllabus reading and printout', 'Last 5 years past papers analysis to understand question trends', 'Daily newspaper editorial reading & issue-based notebook setup', 'English grammar fundamentals, precis rules, and vocabulary expansion', 'Complete Pakistan Affairs & Islamic Studies foundation reading'] },
    { phase: 'Months 4–6', title: 'Core Optionals & General Science & Ability', points: ['Study 400 marks of optional subjects (e.g. Political Science / IR + 2 subjects)', 'Daily quantitative math drills for General Ability (40 marks)', 'Environmental, biological, and physical sciences syllabus coverage (60 marks)', 'Weekly precis writing and sentence correction exercises'] },
    { phase: 'Months 7–8', title: 'Remaining Optionals & Current Affairs', points: ['Complete remaining 200 marks of optional subjects', 'Synthesize Current Affairs dossiers (foreign policy, economy, climate, governance)', 'Begin formulating structured essay outlines with clear thesis statements', 'Review Pakistan Economic Survey key indicators and statistics'] },
    { phase: 'Months 9–10', title: 'Consolidation, MPT Prep & Timed Answers', points: ['First complete revision of all 1,200 marks syllabus notes', 'Dedicated MPT (MCQ Preliminary Test) practice drills (target 130+ marks)', 'Full-length timed single-question answer writing (35 mins per question)', 'Write 2 complete 2,500-word essays under exam conditions'] },
    { phase: 'Months 11–12', title: 'Full Mocks & Final Exam Polish', points: ['Take full 3-hour mock exams for compulsory and optional papers', 'Review FPSC examiner reports to understand why candidates lose marks', 'Refine presentation: headings, flowcharts, relevant quotations, and maps', 'Calm final revision of high-yield summary sheets'] },
  ];

  const sixMonthRoadmap = [
    { phase: 'Month 1', title: 'Orientation & Core Compulsory Subjects', points: ['Syllabus mapping, past papers review, and English diagnostic check', 'Complete Pakistan Affairs and Islamic Studies standard texts', 'Daily newspaper issue notes and English precis practice'] },
    { phase: 'Month 2', title: 'General Science & Ability & Current Affairs', points: ['Cover General Science concepts and daily quantitative problem-solving', 'Build Current Affairs dossiers on national and international issues', 'Weekly essay outline and introductory paragraph drafting'] },
    { phase: 'Months 3–4', title: 'Intensive Optional Subjects Coverage', points: ['Cover all 600 marks of optional subjects with primary focus on past paper trends', 'Create 2-page bullet-point revision sheets for every major syllabus heading', 'Continue weekly precis and grammar practice'] },
    { phase: 'Month 5', title: 'MPT Screening & Comprehensive Revision', points: ['Intensive MCQ practice for MPT (Urdu, English, Islamiat, Math, General Knowledge)', 'Comprehensive revision of compulsory and optional syllabus summaries', 'Timed single-question writing (1 question daily in 35 minutes)'] },
    { phase: 'Month 6', title: 'Full Mock Exams & Final Review', points: ['Simulate actual exam days with 3-hour mock tests', 'Write 3 complete timed essays and get objective evaluation', 'Memorize key economic data, constitutional articles, and authentic quotations'] },
  ];

  return (
    <div className="mt-6 space-y-8">
      {/* 12-Month Plan */}
      <section aria-labelledby="twelve-month-plan">
        <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
          <h4 id="twelve-month-plan" className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
            The 12-Month Comprehensive Preparation Plan (Ideal for Beginners)
          </h4>
          <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-600">Standard Pathway</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {twelveMonthRoadmap.map((stage) => (
            <div key={stage.phase} className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-500">{stage.phase}</span>
              <p className="mt-1 font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>{stage.title}</p>
              <ul className="mt-2 space-y-1 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {stage.points.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-indigo-500">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 6-Month Fast-Track Plan */}
      <section aria-labelledby="six-month-plan">
        <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
          <h4 id="six-month-plan" className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
            The 6-Month Intensive Fast-Track Plan (For Candidates with Strong Fundamentals)
          </h4>
          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600">Accelerated Track</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sixMonthRoadmap.map((stage) => (
            <div key={stage.phase} className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-500">{stage.phase}</span>
              <p className="mt-1 font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>{stage.title}</p>
              <ul className="mt-2 space-y-1 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {stage.points.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-500">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function CssOfficialLinks() {
  const officialSources = [
    { name: 'Federal Public Service Commission (FPSC)', desc: 'Official portal for CSS rules, syllabus, exam schedules, and past papers.', url: 'https://www.fpsc.gov.pk' },
    { name: 'Ministry of Finance – Pakistan Economic Survey', desc: 'Authoritative data on GDP, agriculture, industry, debt, and fiscal policy.', url: 'https://www.finance.gov.pk' },
    { name: 'State Bank of Pakistan (SBP)', desc: 'Monetary policy statements, annual economic reports, and inflation data.', url: 'https://www.sbp.org.pk' },
    { name: 'National Assembly & Senate of Pakistan', desc: 'Authentic texts of constitutional amendments, legislative acts, and official committee reports.', url: 'https://na.gov.pk' },
    { name: 'Ministry of Foreign Affairs (MOFA)', desc: 'Official policy statements, diplomatic releases, and bilateral agreements.', url: 'https://mofa.gov.pk' },
    { name: 'Pakistan Institute of Development Economics (PIDE)', desc: 'Research-backed policy monographs on civil service reform and institutional governance.', url: 'https://pide.org.pk' },
  ];

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {officialSources.map((item) => (
          <div key={item.name} className="rounded-xl border p-4 transition-colors hover:border-[var(--color-accent-text)]" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <a href={item.url} target="_blank" rel="noreferrer" className="text-sm font-bold underline" style={{ color: 'var(--color-accent-text)' }}>
              {item.name} ↗
            </a>
            <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{item.desc}</p>
          </div>
        ))}
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
        Note: Always verify current year deadlines, eligibility clauses, fee challans, and syllabus notifications directly on the official FPSC website (fpsc.gov.pk).
      </p>
    </div>
  );
}
