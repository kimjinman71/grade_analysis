import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  BarChart3, 
  Calculator, 
  BookOpen, 
  GraduationCap, 
  TrendingUp, 
  Download,
  Info,
  FileUp, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Hash, 
  Trophy, 
  Users, 
  Award, 
  Percent, 
  Layers, 
  Lock, 
  Key, 
  ShieldCheck, 
  Table as TableIcon
} from 'lucide-react';

// --- 시스템 구성 상수 (환경변수 보안 적용) ---
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; 
const MODEL_NAME = "gemini-1.5-pro"; // 유료 티어 최상위 정밀 분석 모델

const VALID_PASSWORDS = import.meta.env.VITE_VALID_PASSWORDS 
  ? import.meta.env.VITE_VALID_PASSWORDS.split(',').map(p => p.trim())
  : [];

const SEMESTERS = [
  '1학년 1학기', '1학년 2학기', 
  '2학년 1학기', '2학년 2학기', 
  '3학년 1학기', '3학년 2학기'
];

const YEARS = ['1학년', '2학년', '3학년'];

const SUBJECT_CATEGORIES = [
  { id: '국어', name: '국어', keywords: ['국어', '문학', '독서', '화법', '언어', '매체', '고전'], exclusions: ['중국어', '일본어', '외국어'] },
  { id: '수학', name: '수학', keywords: ['수학', '대수', '미적', '확률', '기하', '통계', '해석'], exclusions: [] },
  { id: '영어', name: '영어', keywords: ['영어', '영미', '독해', '회화', '심화영어'], exclusions: [] },
  { id: '사회', name: '사회', keywords: ['사회', '윤리', '지리', '역사', '경제', '정치', '법', '세계사', '동아시아'], exclusions: [] },
  { id: '과학', name: '과학', keywords: ['과학', '물리', '화학', '생명', '지구', '융합'], exclusions: [] },
  { id: '한국사', name: '한국사', keywords: ['한국사'], exclusions: [] },
  { id: '기타', name: '기타', keywords: ['중국어', '일본어', '한문', '제2외국어', '정보', '기술', '가정', '체육', '음악', '미술'], exclusions: [] }
];

const ACHIEVEMENTS = ['A', 'B', 'C', 'D', 'E'];

// --- Utility: 파일 전처리 및 데이터 분석 해상도 최적화 ---
const optimizeFile = async (file) => {
  if (file.type === "application/pdf") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ data: reader.result.split(',')[1], mimeType: "application/pdf" });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 2500; 
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        resolve({ data: canvas.toDataURL('image/jpeg', 0.95).split(',')[1], mimeType: "image/jpeg" });
      };
    };
  });
};

// --- GradeRow: 개별 교과 성적 행 컴포넌트 ---
const GradeRow = React.memo(({ row, type, mode, updateRow, removeRow }) => {
  return (
    <tr className="hover:bg-slate-50/30 transition-colors group">
      <td className="px-6 py-4">
        <select value={row.semester} onChange={(e) => updateRow(row.id, 'semester', e.target.value)} className="w-full bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer">
          {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </td>
      <td className="px-4 py-4">
        <select value={row.group} onChange={(e) => updateRow(row.id, 'group', e.target.value)} className={`w-full bg-transparent border-none text-xs font-black ${type === 'relative' ? 'text-blue-700' : 'text-emerald-700'} focus:ring-0 cursor-pointer`}>
          {SUBJECT_CATEGORIES.map(g => <option key={g.id} value={g.id}>{g.id}</option>)}
        </select>
      </td>
      <td className="px-4 py-4">
        <input type="text" value={row.name} placeholder="과목" onChange={(e) => updateRow(row.id, 'name', e.target.value)} className="w-full bg-slate-100/50 border-none rounded-xl p-2.5 text-xs font-bold focus:bg-white focus:ring-2 transition-all" />
      </td>
      {mode === 'basic' ? (
        <>
          <td className="px-4 py-4"><input type="number" value={row.credits || ''} onChange={(e) => updateRow(row.id, 'credits', Number(e.target.value))} className="w-16 mx-auto bg-slate-100/50 border-none rounded-lg p-2 text-xs text-center font-bold" /></td>
          <td className="px-4 py-4"><input type="number" value={row.score || ''} onChange={(e) => updateRow(row.id, 'score', Number(e.target.value))} className="w-16 mx-auto bg-slate-100/50 border-none rounded-lg p-2 text-xs text-center font-bold" /></td>
          <td className="px-4 py-4"><input type="number" step="0.1" value={row.mean || ''} onChange={(e) => updateRow(row.id, 'mean', Number(e.target.value))} className="w-16 mx-auto bg-slate-100/50 border-none rounded-lg p-2 text-xs text-center font-bold" /></td>
          <td className="px-4 py-4">
            <select value={row.achievement} onChange={(e) => updateRow(row.id, 'achievement', e.target.value)} className="w-16 mx-auto bg-slate-100/50 border-none rounded-lg p-2 text-xs text-center font-black focus:ring-0">
              {ACHIEVEMENTS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </td>
          <td className="px-4 py-4 text-center">
            {type === 'relative' ? (
              <input type="number" min="1" max="9" value={row.grade || ''} onChange={(e) => updateRow(row.id, 'grade', Number(e.target.value))} className="w-12 mx-auto bg-blue-600 text-white border-none rounded-lg p-2 text-xs text-center font-black" />
            ) : <span className="text-[10px] text-slate-300 italic">미산출</span>}
          </td>
          <td className="px-4 py-4"><input type="number" value={row.studentCount || ''} onChange={(e) => updateRow(row.id, 'studentCount', Number(e.target.value))} className="w-20 mx-auto bg-slate-100/50 border-none rounded-lg p-2 text-xs text-center font-bold" /></td>
        </>
      ) : (
        <>
          <td className="px-4 py-4 text-center font-bold text-xs text-slate-400">{row.credits}</td>
          <td className="px-4 py-4 text-center text-xs font-bold">{type === 'relative' ? <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md">{row.grade}등급</span> : <span className="text-slate-300">-</span>}</td>
          <td className="px-4 py-4 text-center text-xs font-bold text-slate-600">{row.achievement}</td>
          <td className="px-2 py-4 bg-indigo-50/20"><input type="number" step="0.1" value={row.distA || ''} onChange={(e) => updateRow(row.id, 'distA', Number(e.target.value))} className="w-12 mx-auto bg-transparent border-none text-xs text-center font-bold text-indigo-700" /></td>
          <td className="px-2 py-4 bg-indigo-50/20"><input type="number" step="0.1" value={row.distB || ''} onChange={(e) => updateRow(row.id, 'distB', Number(e.target.value))} className="w-12 mx-auto bg-transparent border-none text-xs text-center font-bold text-indigo-700" /></td>
          <td className="px-2 py-4 bg-indigo-50/20"><input type="number" step="0.1" value={row.distC || ''} onChange={(e) => updateRow(row.id, 'distC', Number(e.target.value))} className="w-12 mx-auto bg-transparent border-none text-xs text-center font-bold text-indigo-700" /></td>
          <td className="px-2 py-4 bg-indigo-50/20"><input type="number" step="0.1" value={row.distD || ''} onChange={(e) => updateRow(row.id, 'distD', Number(e.target.value))} className="w-12 mx-auto bg-transparent border-none text-xs text-center font-bold text-indigo-700" /></td>
          <td className="px-2 py-4 bg-indigo-50/20"><input type="number" step="0.1" value={row.distE || ''} onChange={(e) => updateRow(row.id, 'distE', Number(e.target.value))} className="w-12 mx-auto bg-transparent border-none text-xs text-center font-bold text-indigo-700" /></td>
        </>
      )}
      <td className="px-8 py-4 text-right">
        <button onClick={() => removeRow(row.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"><Trash2 size={16} /></button>
      </td>
    </tr>
  );
});

const TableSection = React.memo(({ title, grades, type, mode, updateRow, removeRow, addRow }) => (
  <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-md">
      <h2 className="text-xl font-black text-slate-800 tracking-tight">{title}</h2>
      <button onClick={() => addRow(type)} className={`flex items-center gap-2 ${type === 'relative' ? 'bg-blue-600' : 'bg-emerald-600'} text-white hover:opacity-90 px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-md`}>
        <Plus size={18} /> 과목 추가
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[1200px]">
        <thead>
          <tr className="bg-slate-50/80 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
            <th className="px-8 py-6">학년/학기</th>
            <th className="px-4 py-6">교과</th>
            <th className="px-4 py-6">과목</th>
            {mode === 'basic' ? (
              <>
                <th className="px-4 py-6 text-center w-20">학점</th>
                <th className="px-4 py-6 text-center w-20">원점수</th>
                <th className="px-4 py-6 text-center w-20">과목평균</th>
                <th className="px-4 py-6 text-center w-20">성취도</th>
                <th className="px-4 py-6 text-center w-20">석차등급</th>
                <th className="px-4 py-6 text-center w-24">수강자수</th>
              </>
            ) : (
              <>
                <th className="px-4 py-6 text-center w-20">학점</th>
                <th className="px-4 py-6 text-center w-20">등급</th>
                <th className="px-4 py-6 text-center w-20">성취도</th>
                <th className="px-2 py-6 text-center bg-indigo-50/30 text-indigo-600 font-bold uppercase">A(%)</th>
                <th className="px-2 py-6 text-center bg-indigo-50/30 text-indigo-600 font-bold uppercase">B(%)</th>
                <th className="px-2 py-6 text-center bg-indigo-50/30 text-indigo-600 font-bold uppercase">C(%)</th>
                <th className="px-2 py-6 text-center bg-indigo-50/30 text-indigo-600 font-bold uppercase">D(%)</th>
                <th className="px-2 py-6 text-center bg-indigo-50/30 text-indigo-600 font-bold uppercase">E(%)</th>
              </>
            )}
            <th className="px-8 py-6 w-12"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {grades.map((row) => (
            <GradeRow key={row.id} row={row} type={type} mode={mode} updateRow={updateRow} removeRow={removeRow} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
));

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [grades, setGrades] = useState([
    { id: 1, type: 'relative', semester: '1학년 1학기', group: '국어', name: '국어', credits: 4, score: 95, mean: 65.2, achievement: 'A', grade: 1, studentCount: 320, distA: 15.2, distB: 22.1, distC: 30.5, distD: 20.2, distE: 12.0 },
    { id: 2, type: 'relative', semester: '1학년 1학기', group: '수학', name: '수학', credits: 4, score: 98, mean: 58.7, achievement: 'A', grade: 1, studentCount: 320, distA: 10.5, distB: 18.2, distC: 25.4, distD: 28.1, distE: 17.8 },
    { id: 3, type: 'absolute', semester: '1학년 1학기', group: '과학', name: '과학탐구실험', credits: 1, score: 92, mean: 88.5, achievement: 'A', grade: null, studentCount: 320, distA: 65.4, distB: 20.1, distC: 14.5, distD: 0, distE: 0 },
  ]);
  const [activeTab, setActiveTab] = useState('input');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });
  const fileInputRef = useRef(null);

  const handleAuth = (e) => {
    e?.preventDefault();
    if (VALID_PASSWORDS.includes(passwordInput.toLowerCase())) { setIsAuthenticated(true); setAuthError(''); } 
    else { setAuthError('유효하지 않은 보안 코드입니다. 전문가용 코드를 확인해 주세요.'); }
  };

  // --- 핵심 데이터 추출 및 정밀 파싱 엔진 (유료 티어 최적화) ---
  const analyzeFile = async (file) => {
    setIsAnalyzing(true);
    setUploadStatus({ type: 'info', message: '데이터 분석 시스템이 정밀 해독 중입니다...' });

    try {
      const { data: base64Data, mimeType } = await optimizeFile(file);
      
      // 요청하신 systemPrompt 내용 100% 사용
      const systemPrompt = `당신은 대한민국 고등학교 성적표(나이스 성적통지표) 분석 전문가입니다.
      첨부된 파일에서 성적 데이터를 전수 추출하여 JSON으로 반환하십시오.
      
      [데이터 추출 및 매핑 중요 규칙]
      1. 교과 분류 예외 처리: '중국어', '일본어', '프랑스어' 등 모든 외국어(어문) 교과는 '국어' 교과가 아닌 '기타' 교과(제2외국어)로 분류하십시오. '국어'는 오직 한국어 관련 교과만 해당합니다.
      2. 구조적 해독: 이미지 내 표(Table)의 행(Row) 관계를 파악하여 학기, 과목, 단위수, 원점수, 평균, 성취도, 석차등급을 한 쌍으로 묶으십시오.
      3. 수치 정규화: 모든 텍스트 단위를 완전히 제거하고 순수 숫자(Number)로만 출력하십시오.
      4. 등급(grade) 판정: 석차등급 칸에 숫자 1~9가 기재된 경우만 숫자로, 'P', '.', '-', '공란' 등 미산출 과목은 반드시 null로 출력하십시오.
      5. 학기 정규화: '1학년 1학기'와 같이 시스템 표준 명칭으로 통일하십시오.
      6. A, B, C, D, E 성취도 비율분석에 해당하는 숫자를 정확하게 파싱을 해서 정확하게 매핑해주세요.
      7. 업로드된 파일에서 모든 데이터를 정확하게 파싱하고, 분석 및 파싱 속도를 가속화 해주세요.
      8. 정확한 파싱과 고속화된 파싱된 데이터를 정확하게 맵핑해주세요.
      9. 누락 방지: 파일에 존재하는 모든 학년, 모든 학기의 성적을 단 하나도 빠짐없이 grades 배열에 담으십시오.`;

      // API 호출 페이로드 구성 (유료 티어 설정: BLOCK_NONE)
      const payload = {
        contents: [{ 
          role: "user", 
          parts: [
            { text: "첨부된 파일의 모든 성적 정보를 JSON 배열로 정밀 추출하세요." }, 
            { inlineData: { mimeType, data: base64Data } }
          ] 
        }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`API 통신 실패: ${response.status}`);
      const result = await response.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('추출된 데이터가 없습니다.');

      const parsedData = JSON.parse(rawText.replace(/```json|```/gi, '').trim());
      const rawGrades = parsedData.grades || [];

      if (rawGrades.length > 0) {
        const mappedGrades = rawGrades.map((item, index) => {
          const num = (v, d = 0) => {
            if (v === null || v === undefined || v === '') return d;
            const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
            return isNaN(n) ? d : n;
          };
          let sem = String(item.semester || '').trim();
          const semMatch = sem.match(/([1-3])\s*[학년|-]?\s*([1-2])\s*[학기]?/);
          sem = semMatch ? `${semMatch[1]}학년 ${semMatch[2]}학기` : (SEMESTERS.find(s => s.replace(/\s/g, '').includes(sem.replace(/\s/g, ''))) || '1학년 1학기');
          const subj = String(item.name || '').trim();
          const matchedGrp = SUBJECT_CATEGORIES.find(c => c.id !== '기타' && c.keywords.some(k => subj.includes(k)) && !c.exclusions.some(ex => subj.includes(ex)));
          const gVal = num(item.grade, null);
          const isRel = gVal !== null && gVal >= 1 && gVal <= 9;

          return {
            id: Date.now() + index + Math.random(), type: isRel ? 'relative' : 'absolute', semester: sem, group: matchedGrp ? matchedGrp.id : '기타', name: subj || '미상 과목',
            credits: num(item.credits, 1), score: num(item.score, 0), mean: num(item.mean, 0), achievement: String(item.achievement || 'A').toUpperCase().charAt(0),
            grade: isRel ? gVal : null, studentCount: num(item.studentCount, 0),
            distA: num(item.distA, 0), distB: num(item.distB, 0), distC: num(item.distC, 0), distD: num(item.distD, 0), distE: num(item.distE, 0)
          };
        });
        setGrades(mappedGrades);
        setUploadStatus({ type: 'success', message: `분석 완료: ${mappedGrades.length}개의 데이터가 전문가 리포트에 정밀 연동되었습니다.` });
      } else { throw new Error('데이터 파싱 결과가 비어있습니다.'); }
    } catch (error) {
      console.error("Precision Parsing Error:", error);
      setUploadStatus({ type: 'error', message: '데이터 추출 중 오류가 발생했습니다. 이미지 상태를 확인해 주세요.' });
    } finally { setIsAnalyzing(false); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && ["application/pdf", "image/jpeg", "image/png", "image/jpg"].includes(file.type)) analyzeFile(file);
    else if (file) setUploadStatus({ type: 'error', message: '지원되지 않는 파일 형식입니다.' });
  };

  // --- 기존 UI 유지용 로직 및 계산 엔진 ---
  const updateRow = useCallback((id, field, value) => {
    setGrades(prev => prev.map(g => {
      if (g.id === id) {
        const newRow = { ...g, [field]: value };
        if (field === 'grade') {
          const num = parseInt(value, 10);
          newRow.type = (!isNaN(num) && num >= 1 && num <= 9) ? 'relative' : 'absolute';
        }
        return newRow;
      }
      return g;
    }));
  }, []);

  const removeRow = useCallback((id) => setGrades(prev => prev.filter(g => g.id !== id)), []);
  const addRow = useCallback((type) => setGrades(prev => [...prev, { id: Date.now(), type, semester: '1학년 1학기', group: '국어', name: '', credits: 1, score: 0, mean: 0, achievement: 'A', studentCount: 0, grade: type === 'relative' ? 1 : null, distA: 0, distB: 0, distC: 0, distD: 0, distE: 0 }]), []);

  const analysis = useMemo(() => {
    const norm = (s) => String(s || '').replace(/\s+/g, '');
    const calculateWeightedAvg = (items) => {
      let totalC = 0, sum = 0, valid = 0;
      items.forEach(i => {
        const c = parseFloat(i.credits) || 0;
        const g = parseFloat(i.grade) || 0;
        if (c > 0 && g >= 1 && g <= 9) { totalC += c; sum += (c * g); valid++; }
      });
      return (valid > 0 && totalC > 0) ? (sum / totalC).toFixed(2) : "-";
    };
    const rowDefs = [
      { label: '전교과', filter: () => true },
      { label: '국수영사과', filter: (g) => ['국어', '수학', '영어', '사회', '과학', '한국사'].some(t => norm(g.group).includes(norm(t))) },
      { label: '국수영사', filter: (g) => ['국어', '수학', '영어', '사회', '한국사'].some(t => norm(g.group).includes(norm(t))) },
      { label: '국수영과', filter: (g) => ['국어', '수학', '영어', '과학'].some(t => norm(g.group).includes(norm(t))) },
      { label: '국어', filter: (g) => norm(g.group).includes('국어') },
      { label: '수학', filter: (g) => norm(g.group).includes('수학') },
      { label: '영어', filter: (g) => norm(g.group).includes('영어') },
      { label: '사회', filter: (g) => ['사회', '한국사'].some(t => norm(g.group).includes(norm(t))) },
      { label: '과학', filter: (g) => norm(g.group).includes('과학') },
    ];
    return {
      semesterMatrix: rowDefs.map(d => ({ label: d.label, all: calculateWeightedAvg(grades.filter(g => g.type === 'relative').filter(d.filter)), ...SEMESTERS.reduce((acc, s) => ({ ...acc, [s]: calculateWeightedAvg(grades.filter(g => g.type === 'relative').filter(d.filter).filter(g => norm(g.semester) === norm(s))) }), {}) })),
      gradeMatrix: rowDefs.map(d => ({ label: d.label, all: calculateWeightedAvg(grades.filter(g => g.type === 'relative').filter(d.filter)), ...YEARS.reduce((acc, y) => ({ ...acc, [y]: calculateWeightedAvg(grades.filter(g => g.type === 'relative').filter(d.filter).filter(g => norm(g.semester).startsWith(norm(y)))) }), {}) }))
    };
  }, [grades]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-10 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200"><Lock className="text-white" size={40} /></div>
            <h1 className="text-2xl font-black text-slate-800 mb-2">보안 코드 인증</h1>
            <p className="text-slate-500 text-sm font-medium mb-8">데이터 분석 시스템입니다.<br/>접근을 위해 보안 코드를 입력해 주세요.</p>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="보안 코드 입력" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300" />
              </div>
              {authError && <div className="flex items-center gap-2 text-red-500 text-xs font-bold justify-center animate-bounce"><AlertCircle size={14} />{authError}</div>}
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3"><ShieldCheck size={24} />시스템 접속</button>
            </form>
            <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Secured by IpsiSketch Data Lab</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <header className="max-w-[1450px] mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3"><GraduationCap className="text-blue-600" size={36} />내신 성적 정밀 분석 시스템</h1>
          <p className="text-slate-500 mt-1 font-medium ml-1">내신 성적 분석 엔진 및 정밀 리포트</p>
        </div>
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-200 print:hidden">
          <button onClick={() => setActiveTab('input')} className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'input' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}`}>데이터 입력</button>
          <button onClick={() => setActiveTab('analysis')} className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'analysis' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}`}>정밀 리포트</button>
        </div>
      </header>

      <main className="max-w-[1450px] mx-auto">
        {activeTab === 'input' ? (
          <div className="space-y-12">
            <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                    <div className="max-w-2xl">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><FileUp size={32} className="text-blue-400" />데이터 정밀 추출</h2>
                        <p className="text-slate-300 text-lg leading-relaxed">나이스 성적표 <span className="text-blue-300 font-bold underline underline-offset-4">파일(PDF)</span>을 업로드하세요. <br/>전 학년 성적 데이터를 고속 스캔하여 전 영역을 정밀하게 추출합니다.</p>
                    </div>
                    <div className="flex flex-col items-center gap-4 shrink-0">
                        <input type="file" accept="application/pdf,image/png,image/jpeg" onChange={handleFileUpload} ref={fileInputRef} className="hidden" />
                        <button disabled={isAnalyzing} onClick={() => fileInputRef.current?.click()} className="bg-white text-blue-900 px-14 py-5 rounded-[1.5rem] font-black shadow-xl hover:bg-blue-50 hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 text-lg">{isAnalyzing ? <Loader2 className="animate-spin" /> : <FileUp size={24} />}{isAnalyzing ? '데이터 고속 전수 분석 중...' : '성적표 파일 업로드'}</button>
                    </div>
                </div>
                {uploadStatus.message && (
                  <div className={`mt-8 p-5 rounded-2xl flex items-center gap-4 text-sm font-bold ${uploadStatus.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : uploadStatus.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-white/10 text-blue-200 border border-white/20'}`}>{uploadStatus.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}{uploadStatus.message}</div>
                )}
            </div>

            <div className="space-y-10">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 ml-2"><Layers className="text-blue-600" size={28} />교과 성적 데이터 관리</h2>
              <TableSection title="상대평가 (석차등급)" type="relative" mode="basic" grades={grades.filter(g => g.type === 'relative')} updateRow={updateRow} removeRow={removeRow} addRow={addRow} />
              <TableSection title="절대평가 (성취도)" type="absolute" mode="basic" grades={grades.filter(g => g.type === 'absolute')} updateRow={updateRow} removeRow={removeRow} addRow={addRow} />
              <TableSection title="성취도별 분포 비율 진단" type="relative" mode="distribution" grades={grades} updateRow={updateRow} removeRow={removeRow} addRow={addRow} />
            </div>
          </div>
        ) : (
          <div className="space-y-12 pb-24">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-slate-300">
                <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-white"><div className="p-3 bg-blue-50 rounded-2xl print:hidden"><TableIcon className="text-blue-600" size={24} /></div><h2 className="text-2xl font-black text-slate-800">내신성적 정밀 분석표 (학기별)</h2></div>
                <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-widest border-b border-slate-200"><th className="px-8 py-5 border-r border-slate-100">교과</th><th className="px-6 py-5 text-center bg-blue-50/50 text-blue-700 border-r border-slate-100 font-black">전학년</th>{SEMESTERS.map(sem => <th key={sem} className="px-6 py-5 text-center border-r border-slate-100 whitespace-nowrap">{sem}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{analysis.semesterMatrix.map((row, idx) => (<tr key={idx} className={`${idx < 4 ? 'bg-slate-50/30' : ''} hover:bg-blue-50/30 transition-colors`}><td className={`px-8 py-4 font-bold text-sm border-r border-slate-100 ${idx < 4 ? 'text-blue-900' : 'text-slate-600'}`}>{row.label}</td><td className="px-6 py-4 text-center font-black text-blue-600 bg-blue-50/10 border-r border-slate-100">{row.all}</td>{SEMESTERS.map(sem => <td key={sem} className="px-6 py-4 text-center text-sm font-semibold text-slate-700 border-r border-slate-100">{row[sem]}</td>)}</tr>))}</tbody></table></div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-slate-300">
                <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-white"><div className="p-3 bg-indigo-50 rounded-2xl print:hidden"><Layers className="text-indigo-600" size={24} /></div><h2 className="text-2xl font-black text-slate-800">내신성적 정밀 분석표 (학년별)</h2></div>
                <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-widest border-b border-slate-200"><th className="px-8 py-5 border-r border-slate-100">교과</th><th className="px-6 py-5 text-center bg-indigo-50/50 text-indigo-700 border-r border-slate-100 font-black">전학년</th>{YEARS.map(year => <th key={year} className="px-10 py-5 text-center border-r border-slate-100 whitespace-nowrap">{year} 전체</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{analysis.gradeMatrix.map((row, idx) => (<tr key={idx} className={`${idx < 4 ? 'bg-indigo-50/10' : ''} hover:bg-indigo-50/30 transition-colors`}><td className={`px-8 py-4 font-bold text-sm border-r border-slate-100 ${idx < 4 ? 'text-indigo-900' : 'text-slate-600'}`}>{row.label}</td><td className="px-6 py-4 text-center font-black text-indigo-600 bg-indigo-50/10 border-r border-slate-100">{row.all}</td>{YEARS.map(year => <td key={year} className="px-10 py-4 text-center text-sm font-semibold text-slate-700 border-r border-slate-100">{row[year]}</td>)}</tr>))}</tbody></table></div>
            </div>
          </div>
        )}
      </main>
      <footer className="max-w-[1450px] mx-auto mt-20 py-10 border-t border-slate-200 text-center text-slate-400 text-sm font-bold print:hidden">&copy; Admissions Data IpsiSketch Lab. All Rights Reserved.</footer>
    </div>
  );
};

export default App;