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

// --- 시스템 구성 상수 (보안 강화: 환경 변수 호출) ---
const apiKey = process.env.REACT_APP_GEMINI_API_KEY; 
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";

// 환경변수에서 쉼표로 구분된 비밀번호를 가져와 배열화합니다.
const VALID_PASSWORDS = (process.env.REACT_APP_VALID_PASSWORDS || "").split(',').map(p => p.trim());

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

// --- GradeRow Component ---
const GradeRow = React.memo(({ row, type, mode, updateRow, removeRow }) => {
  return (
    <tr className="hover:bg-slate-50/30 transition-colors group">
      <td className="px-6 py-4">
        <select 
          value={row.semester} 
          onChange={(e) => updateRow(row.id, 'semester', e.target.value)} 
          className="w-full bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer"
        >
          {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </td>
      <td className="px-4 py-4">
        <select 
          value={row.group} 
          onChange={(e) => updateRow(row.id, 'group', e.target.value)} 
          className={`w-full bg-transparent border-none text-xs font-black ${type === 'relative' ? 'text-blue-700' : 'text-emerald-700'} focus:ring-0 cursor-pointer`}
        >
          {SUBJECT_CATEGORIES.map(g => <option key={g.id} value={g.id}>{g.id}</option>)}
        </select>
      </td>
      <td className="px-4 py-4">
        <input 
          type="text" 
          value={row.name} 
          placeholder="과목" 
          onChange={(e) => updateRow(row.id, 'name', e.target.value)} 
          className="w-full bg-slate-100/50 border-none rounded-xl p-2.5 text-xs font-bold focus:bg-white focus:ring-2 transition-all" 
        />
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

// --- TableSection Component ---
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

// --- Main App Component ---
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [grades, setGrades] = useState([
    { 
      id: 1, type: 'relative', semester: '1학년 1학기', group: '국어', name: '국어', 
      credits: 4, score: 95, mean: 65.2, achievement: 'A', grade: 1, studentCount: 320,
      distA: 15.2, distB: 22.1, distC: 30.5, distD: 20.2, distE: 12.0
    }
  ]);

  const [activeTab, setActiveTab] = useState('input');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });
  const fileInputRef = useRef(null);

  const handleAuth = (e) => {
    e?.preventDefault();
    if (VALID_PASSWORDS.includes(passwordInput.toLowerCase())) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('유효하지 않은 보안 코드입니다.');
    }
  };

  const analyzeFile = async (file) => {
    if (!apiKey) {
      setUploadStatus({ type: 'error', message: 'API Key가 설정되지 않았습니다.' });
      return;
    }
    setIsAnalyzing(true);
    setUploadStatus({ type: 'info', message: '데이터 분석 중...' });

    try {
      const { data: base64Data, mimeType } = await optimizeFile(file);
      
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

      const payload = {
        contents: [{ 
          role: "user", 
          parts: [
            { text: "성적표 이미지 내 모든 데이터를 전수 추출하십시오." },
            { inlineData: { mimeType: mimeType, data: base64Data } }
          ] 
        }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { 
          temperature: 0.1, 
          responseMimeType: "application/json" 
        }
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (rawText) {
        const parsed = JSON.parse(rawText);
        if (parsed.grades) {
          const mapped = parsed.grades.map((item, idx) => ({
            ...item,
            id: Date.now() + idx,
            type: (item.grade && item.grade >= 1 && item.grade <= 9) ? 'relative' : 'absolute'
          }));
          setGrades(mapped);
          setUploadStatus({ type: 'success', message: '분석이 완료되었습니다.' });
        }
      }
    } catch (error) {
      setUploadStatus({ type: 'error', message: '분석 중 오류 발생' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) analyzeFile(file);
  };

  const updateRow = useCallback((id, field, value) => {
    setGrades(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
  }, []);

  const removeRow = useCallback((id) => {
    setGrades(prev => prev.filter(g => g.id !== id));
  }, []);

  const addRow = useCallback((type) => {
    setGrades(prev => [...prev, {
      id: Date.now(),
      type: type,
      semester: '1학년 1학기',
      group: '국어',
      name: '',
      credits: 1,
      grade: type === 'relative' ? 1 : null
    }]);
  }, []);

  const analysis = useMemo(() => {
    const calculateWeightedAvg = (items) => {
      let totalC = 0, sumG = 0;
      items.forEach(i => {
        if (i.grade && i.credits) {
          totalC += Number(i.credits);
          sumG += (Number(i.credits) * Number(i.grade));
        }
      });
      return totalC > 0 ? (sumG / totalC).toFixed(2) : "-";
    };

    const relativeOnly = grades.filter(g => g.type === 'relative');

    return {
      semesterMatrix: [
        { label: '전교과', all: calculateWeightedAvg(relativeOnly) }
      ],
      gradeMatrix: [
        { label: '전교과', all: calculateWeightedAvg(relativeOnly) }
      ]
    };
  }, [grades]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 text-center shadow-2xl">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="text-white" size={40} />
          </div>
          <h1 className="text-2xl font-black mb-8">보안 코드 인증</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full p-4 bg-slate-100 rounded-2xl border-none focus:ring-2 focus:ring-blue-500"
              placeholder="보안 코드를 입력하세요"
            />
            {authError && <p className="text-red-500 text-sm font-bold">{authError}</p>}
            <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black flex items-center justify-center gap-2">
              <ShieldCheck size={20} /> 시스템 접속
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1450px] mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black flex items-center gap-3">
          <GraduationCap className="text-blue-600" size={36} /> 내신 성적 분석 시스템
        </h1>
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border">
          <button onClick={() => setActiveTab('input')} className={`px-6 py-2 rounded-xl text-sm font-bold ${activeTab === 'input' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>입력</button>
          <button onClick={() => setActiveTab('analysis')} className={`px-6 py-2 rounded-xl text-sm font-bold ${activeTab === 'analysis' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>리포트</button>
        </div>
      </header>

      {activeTab === 'input' ? (
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2">성적표 업로드</h2>
              <p className="text-slate-400">PDF 또는 이미지 파일을 업로드하여 데이터를 자동으로 추출합니다.</p>
            </div>
            <input type="file" onChange={handleFileUpload} ref={fileInputRef} className="hidden" />
            <button 
              onClick={() => fileInputRef.current.click()}
              disabled={isAnalyzing}
              className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black flex items-center gap-2"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" /> : <FileUp />} 파일 선택
            </button>
          </div>
          <TableSection title="상대평가" type="relative" mode="basic" grades={grades.filter(g => g.type === 'relative')} updateRow={updateRow} removeRow={removeRow} addRow={addRow} />
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] p-8 border shadow-sm">
          <h2 className="text-2xl font-black mb-6">학기별 분석 결과</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                <th className="p-4">구분</th>
                <th className="p-4">전체 평균</th>
              </tr>
            </thead>
            <tbody>
              {analysis.semesterMatrix.map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="p-4 font-bold">{row.label}</td>
                  <td className="p-4 font-black text-blue-600">{row.all}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default App;