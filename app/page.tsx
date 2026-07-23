"use client";

import { useState } from "react";
import Papa from "papaparse";

type CsvRow = Record<string, string>;

type AnalysisItem = {
  index: number;
  sentiment: string;
  topic: string;
  issue: string;
  plain_explanation: string;
  urgency: number;
  suggestion: string;
  confidence: number;
};

function cleanColumnName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replaceAll(" ", "")
    .replaceAll("_", "")
    .replaceAll("-", "");
}

function findColumn(
  columns: string[],
  possibleNames: string[]
) {
  const cleanedPossibleNames = possibleNames.map(
    cleanColumnName
  );

  const matchedColumn = columns.find((column) => {
    const cleanedColumn = cleanColumnName(column);

    return cleanedPossibleNames.some((possibleName) => {
      return (
        cleanedColumn === possibleName ||
        cleanedColumn.includes(possibleName)
      );
    });
  });

  return matchedColumn ?? "";
}

const Icon = ({ children }: { children: React.ReactNode }) => <span className="icon">{children}</span>;

const nav = [
  ["overview", "⌂", "总览"], ["monitor", "◎", "竞品监测"], ["product", "◇", "自家产品"],
  ["reviews", "☵", "评论分析"], ["reports", "▤", "报告中心"], ["sources", "⌘", "数据源管理"],
];

const reviews = [
  { source: "小红书", brand: "竞品 A", text: "新版本的操作入口藏得太深，第一次用完全找不到。", tag: "易用性", tone: "负面", time: "12 分钟前" },
  { source: "App Store", brand: "我的产品", text: "客服响应很快，但希望可以批量导出历史数据。", tag: "功能建议", tone: "中性", time: "38 分钟前" },
  { source: "京东", brand: "竞品 B", text: "包装和质感都超出预期，安装说明也很清楚。", tag: "产品体验", tone: "正面", time: "1 小时前" },
];

export default function Home() {
  const [active, setActive] = useState("overview");
  const [range, setRange] = useState("近 7 天");
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState<null | "source" | "report">(null);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [commentColumn, setCommentColumn] = useState("");
  const [ratingColumn, setRatingColumn] = useState("");
  const [authorColumn, setAuthorColumn] = useState("");
  const [dateColumn, setDateColumn] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [analysisResults, setAnalysisResults] =
  useState<AnalysisItem[]>([]);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };
  const handleCsvUpload = (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  Papa.parse<CsvRow>(file, {
    header: true,
    skipEmptyLines: true,

    complete: (result) => {
      const rows = result.data;
      const columns = result.meta.fields ?? [];
      const detectedCommentColumn = findColumn(
  columns,
  [
    "评论内容",
    "用户评论",
    "用户评价",
    "评价内容",
    "评论",
    "评价",
    "内容",
    "正文",
    "反馈",
    "comment",
    "review",
    "content",
    "text",
  ]
);

const detectedRatingColumn = findColumn(
  columns,
  [
    "评级",
    "评分",
    "星级",
    "分数",
    "rating",
    "score",
    "stars",
  ]
);

const detectedAuthorColumn = findColumn(
  columns,
  [
    "作者",
    "用户名",
    "用户",
    "昵称",
    "评论者",
    "买家",
    "author",
    "username",
    "user",
    "nickname",
  ]
);

const detectedDateColumn = findColumn(
  columns,
  [
    "发布时间",
    "发表时间",
    "评论时间",
    "评价时间",
    "日期",
    "时间",
    "publishedat",
    "createdat",
    "date",
    "time",
  ]
);

      setCsvRows(rows);
      setCsvColumns(columns);
      setCsvFileName(file.name);  
      
      setCommentColumn(detectedCommentColumn);
      setRatingColumn(detectedRatingColumn);
      setAuthorColumn(detectedAuthorColumn);
      setDateColumn(detectedDateColumn);

      notify(`读取成功：发现 ${rows.length} 条数据`);
    },

    error: (error) => {
      notify(`读取失败：${error.message}`);
    },
  });
};
const analyzeFirstFive = async () => {
  if (!commentColumn) {
    notify("请先选择评论内容列");
    return;
  }

  const reviewsToAnalyze = csvRows
    .filter((row) => {
      const content = row[commentColumn];

      return content && content.trim().length > 0;
    })
    .slice(0, 5)
    .map((row) => ({
      author: authorColumn
        ? row[authorColumn] || "未知用户"
        : "未知用户",

      rating: ratingColumn
        ? row[ratingColumn] || ""
        : "",

      content: row[commentColumn],
    }));

  if (reviewsToAnalyze.length === 0) {
    notify("没有找到可以分析的评论");
    return;
  }

  setIsAnalyzing(true);
  setAnalysisResults([]);

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        reviews: reviewsToAnalyze,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "评论分析请求失败"
      );
    }

    const results =
      data.analysis?.results ?? [];

    setAnalysisResults(results);

    notify(
      `分析完成：共分析 ${results.length} 条评论`
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "评论分析失败";

    notify(message);
  } finally {
    setIsAnalyzing(false);
  }
};
  const title = nav.find(n => n[0] === active)?.[2] || "总览";

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="brandMark">观</div><div><b>观微 Insight</b><span>用户声音智能平台</span></div></div>
        <nav>{nav.map(([id, glyph, label]) => <button key={id} onClick={() => setActive(id)} className={active === id ? "active" : ""}><Icon>{glyph}</Icon>{label}{id === "reviews" && <em>12</em>}</button>)}</nav>
        <div className="sideBottom"><div className="plan"><span>专业版 · 运行正常</span><div><i /></div><small>本月已分析 18,640 / 30,000 条</small></div><button onClick={() => notify("帮助中心已为你打开")}>?　帮助与支持</button><div className="profile"><div className="avatar">林</div><div><b>林小满</b><span>产品负责人</span></div><button>•••</button></div></div>
      </aside>

      <section className="workspace">
        <header><div><span className="eyebrow">2026年7月14日 · 星期二</span><h1>{title}</h1></div><div className="headerActions"><button className="ghost" onClick={() => setModal("source")}>＋ 添加数据源</button><button className="primary" onClick={() => setModal("report")}>✦ 生成报告</button></div></header>

        {active === "overview" ? <>
          <div className="welcome"><div><span className="live"><i /> 数据已更新至 09:42</span><h2>早上好，产品经理</h2><p>昨日至今共发现 <b>486 条</b>新评论，其中有 <b>3 个高优先级问题</b>值得关注。</p></div><button onClick={() => { setActive("reviews"); notify("已筛选高优先级问题"); }}>查看优先问题 →</button></div>
          <div className="metrics">
            <Metric label="新增评论" value="486" change="↑ 18.2%" sub="较上一周期" color="mint" bars={[22,35,28,45,38,58,72]} />
            <Metric label="正面口碑率" value="72.8%" change="↑ 4.6%" sub="较上一周期" color="blue" bars={[35,30,42,45,50,58,63]} />
            <Metric label="待跟进问题" value="23" change="5 个紧急" sub="需要产品团队处理" color="orange" bars={[62,58,45,48,38,30,24]} />
            <Metric label="覆盖数据源" value="8" change="全部正常" sub="最近同步 3 分钟前" color="purple" bars={[30,30,42,42,56,56,70]} />
          </div>
          <div className="grid">
            <section className="card trend"><CardHead title="口碑趋势" sub="自家产品与重点竞品对比" range={range} setRange={setRange} />
              <div className="legend"><span><i className="our"/>我的产品 72.8%</span><span><i className="comp"/>竞品均值 65.1%</span></div>
              <div className="chart"><div className="axis"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="plot"><div className="line ours"/><div className="line theirs"/><div className="chartDot d1"/><div className="chartDot d2"/><div className="tooltip">72.8%<small>7月13日</small></div></div></div>
              <div className="dates"><span>7月8日</span><span>7月9日</span><span>7月10日</span><span>7月11日</span><span>7月12日</span><span>7月13日</span><span>7月14日</span></div>
            </section>
            <section className="card topics"><CardHead title="热门话题" sub="用户讨论最多的主题" /><div className="topicList">
              {[['产品易用性','1,286','+24%','78'],['价格与性价比','946','+12%','61'],['客服响应','728','+31%','48'],['新版本体验','562','+8%','39'],['数据导出','384','+46%','28']].map((x,i)=><div className="topic" key={x[0]}><b>{i+1}</b><div><span>{x[0]}</span><small>{x[1]} 条讨论</small></div><div className="topicBar"><i style={{width:`${x[3]}%`}}/></div><em>{x[2]}</em></div>)}
            </div><button className="cardLink" onClick={() => setActive("reviews")}>查看全部话题 →</button></section>
          </div>
          <section className="card feed"><CardHead title="最新用户声音" sub="跨平台实时汇总的新评论" /><div className="filters"><button className="selected">全部</button><button>我的产品</button><button>竞品</button><button onClick={() => notify("筛选器已打开")}>⚙ 筛选</button></div><div className="reviewTable"><div className="tr th"><span>来源 / 产品</span><span>评论内容</span><span>AI 识别</span><span>时间</span></div>{reviews.map((r,i)=><div className="tr" key={i}><span><b className={`source s${i}`}>{r.source.slice(0,1)}</b><span><strong>{r.source}</strong><small>{r.brand}</small></span></span><p>{r.text}</p><span><i className={`tone ${r.tone}`}>{r.tone}</i><small>{r.tag}</small></span><time>{r.time}</time></div>)}</div><button className="cardLink bottom" onClick={() => setActive("reviews")}>进入评论中心，查看全部 486 条 →</button></section>
        </> : <FeaturePage active={active} notify={notify} openSource={() => setModal("source")} openReport={() => setModal("report")} />}
      </section>

      {toast && <div className="toast">✓ {toast}</div>}
      {modal && <div className="overlay" onClick={() => setModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={() => setModal(null)}>×</button>{modal === "source" ? <><span className="modalIcon">⌘</span><h2>添加新的数据源</h2><p>选择要持续监测的公开评论渠道，系统会自动去重并每日同步。<div className="csvUpload">
  <label htmlFor="csv-file">
    <strong>上传评论表格</strong>
    <span>请选择 CSV UTF-8 文件</span>
  </label>

  <input
    id="csv-file"
    type="file"
    accept=".csv,text/csv"
    onChange={handleCsvUpload}
  />

  {csvFileName && (
  <div className="csvResult">
    <b>已读取：{csvFileName}</b>
    <span>共 {csvRows.length} 行数据</span>
    <span>发现表头：{csvColumns.join("、")}</span>

    <div className="columnMapping">
      <label>
        评论内容列
        <select
          value={commentColumn}
          onChange={(event) =>
            setCommentColumn(event.target.value)
          }
        >
          <option value="">请选择</option>

          {csvColumns.map((column) => (
            <option key={column} value={column}>
              {column}
            </option>
          ))}
        </select>
      </label>

      <label>
        评分列
        <select
          value={ratingColumn}
          onChange={(event) =>
            setRatingColumn(event.target.value)
          }
        >
          <option value="">没有评分列</option>

          {csvColumns.map((column) => (
            <option key={column} value={column}>
              {column}
            </option>
          ))}
        </select>
      </label>

      <label>
        作者列
        <select
          value={authorColumn}
          onChange={(event) =>
            setAuthorColumn(event.target.value)
          }
        >
          <option value="">没有作者列</option>

          {csvColumns.map((column) => (
            <option key={column} value={column}>
              {column}
            </option>
          ))}
        </select>
      </label>

      <label>
        日期列
        <select
          value={dateColumn}
          onChange={(event) =>
            setDateColumn(event.target.value)
          }
        >
          <option value="">没有日期列</option>

          {csvColumns.map((column) => (
            <option key={column} value={column}>
              {column}
            </option>
          ))}
        </select>
      </label>
    </div>
  {commentColumn && (
  <div className="csvPreview">
    <strong>评论预览</strong>

    {csvRows.slice(0, 5).map((row, index) => (
      <div className="previewRow" key={index}>
        <div>
          <b>
            {authorColumn
              ? row[authorColumn] || "未知用户"
              : "未知用户"}
          </b>

          <span>
            {ratingColumn
              ? `${row[ratingColumn] || "暂无"} 星`
              : "暂无评分"}
          </span>
        </div>

        <p>
          {row[commentColumn] || "该行没有评论内容"}
        </p>
      </div>
    ))}
  </div>
)}
{commentColumn && csvRows.length > 0 && (
  <button
    className="primary analyzeButton"
    onClick={analyzeFirstFive}
    disabled={isAnalyzing}
  >
    {isAnalyzing
      ? "AI正在分析，请稍候……"
      : "✦ 分析前5条评论"}
  </button>
)}
{analysisResults.length > 0 && (
  <div className="analysisResults">
    <strong>AI分析结果</strong>

    {analysisResults.map((item) => (
      <div
        className="analysisItem"
        key={item.index}
      >
        <div className="analysisTop">
          <b>{item.topic}</b>

          <span
            className={
              item.sentiment === "负面"
                ? "negative"
                : item.sentiment === "正面"
                  ? "positive"
                  : "neutral"
            }
          >
            {item.sentiment}
          </span>
        </div>

        <p>
          <strong>核心问题：</strong>
          {item.issue}
        </p>

        <p>
           <strong>通俗解释：</strong>
           {item.plain_explanation}
        </p>

        <p>
          <strong>处理建议：</strong>
          {item.suggestion}
        </p>

        <div className="analysisMeta">
          <span>
            紧急程度：{item.urgency}/5
          </span>

          <span>
            置信度：
            {Math.round(item.confidence * 100)}%
          </span>
        </div>
      </div>
    ))}
  </div>
)}
  </div>
)}
</div></p><div className="sourceGrid">{["App Store","小红书","京东 / 淘宝","微博","知乎","CSV / Excel"].map(s=><button key={s} onClick={() => notify(`${s} 连接向导已启动`)}>{s}<span>连接 →</span></button>)}</div></> : <><span className="modalIcon">✦</span><h2>一键生成洞察报告</h2><p>AI 会汇总趋势、风险、用户原声和产品改进建议。</p><label>报告类型</label><div className="reportChoice"><button className="chosen">每日简报<small>今日新增与紧急问题</small></button><button>每周洞察<small>趋势对比与机会建议</small></button></div><button className="primary wide" onClick={() => {setModal(null); notify("报告生成中，完成后会通知你");}}>开始生成</button></>}</div></div>}
    </main>
  );
}

function Metric({label,value,change,sub,color,bars}:{label:string,value:string,change:string,sub:string,color:string,bars:number[]}) { return <div className="metric"><span>{label}</span><div><strong>{value}</strong><em className={color}>{change}</em></div><small>{sub}</small><div className={`spark ${color}`}>{bars.map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div></div> }
function CardHead({title,sub,range,setRange}:{title:string,sub:string,range?:string,setRange?:(x:string)=>void}) { return <div className="cardHead"><div><h3>{title}</h3><p>{sub}</p></div>{range&&<select value={range} onChange={e=>setRange?.(e.target.value)}><option>近 7 天</option><option>近 30 天</option><option>本季度</option></select>}</div> }
function FeaturePage({active,notify,openSource,openReport}:{active:string,notify:(x:string)=>void,openSource:()=>void,openReport:()=>void}) {
  const content:Record<string,[string,string,string,string[]]> = {
    monitor:["竞品动态，一眼掌握","持续追踪公开渠道里的新品反馈、口碑变化与用户流失信号。","◎",["竞品 A · 口碑上升 8.4%","竞品 B · 出现 16 条价格投诉","竞品 C · 新功能讨论量上升"]],
    product:["听懂每一位用户","将自家产品评论聚合为需求、问题和可执行的产品机会。","◇",["数据导出 · 需求热度高","移动端入口 · 体验待优化","客服响应 · 用户认可度高"]],
    reviews:["486 条新声音已归类","按情感、主题、紧急度和来源快速找到真正重要的评论。","☵",reviews.map(r=>`${r.brand} · ${r.text}`)],
    reports:["把洞察送到团队手上","自动生成日报与周报，并可安排固定时间发送给产品、运营和管理层。","▤",["7月14日 · 每日用户声音简报","第28周 · 竞品口碑周报","6月 · 产品体验月度复盘"]],
    sources:["连接公开数据渠道","管理采集范围、同步频率和合规状态，确保只处理允许使用的公开数据。","⌘",["App Store · 同步正常","小红书 · 同步正常","电商评价 · 同步正常"]]
  };
  const [title,desc,icon,items]=content[active];
  return <div className="feature"><section className="featureHero"><span>{icon}</span><div><h2>{title}</h2><p>{desc}</p></div><button className="primary" onClick={active==='sources'?openSource:active==='reports'?openReport:()=>notify('任务已开始，稍后会通知你')}>{active==='sources'?'＋ 添加数据源':active==='reports'?'✦ 生成新报告':'▶ 立即分析'}</button></section><div className="featureGrid"><section className="card"><CardHead title="今日重点" sub="系统已按影响范围自动排序"/>{items.map((x,i)=><div className="insightRow" key={x}><b>0{i+1}</b><span>{x}</span><em>{i===0?'高优先级':'查看详情'} →</em></div>)}</section><section className="card next"><h3>推荐下一步</h3><p>根据最新数据，为你准备好的快捷操作。</p><button onClick={()=>notify('分析任务已创建')}>分析最近 24 小时评论 <span>→</span></button><button onClick={openReport}>生成团队简报 <span>→</span></button><button onClick={openSource}>调整监测范围 <span>→</span></button></section></div></div>
}
