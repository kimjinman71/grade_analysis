// import React, { useState, useMemo, useRef, useCallback } from 'react';
// import { 
//   Plus, 
//   Trash2, 
//   GraduationCap, 
//   FileUp, 
//   Loader2, 
//   CheckCircle2, 
//   AlertCircle, 
//   Layers, 
//   Lock, 
//   Key, 
//   ShieldCheck, 
//   Table as TableIcon,
//   Printer
// } from 'lucide-react';

// // --- 시스템 구성 상수 ---
// // (Canvas 통합 환경 구동을 위해 정적 변수로 안전하게 처리되었습니다. 실제 Vercel 배포 시에는 import.meta.env 로 복구하시면 됩니다.)
// const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
// const MODEL_NAME = "gemini-2.5-flash";

// const rawPasswords = import.meta.env.VITE_VALID_PASSWORDS || "";
// const VALID_PASSWORDS = rawPasswords.split(',').map(p => p.trim().toLowerCase());

// const SEMESTERS = [
//   '1학년 1학기', '1학년 2학기', 
//   '2학년 1학기', '2학년 2학기', 
//   '3학년 1학기', '3학년 2학기'
// ];

// const YEARS = ['1학년', '2학년', '3학년'];

// const SUBJECT_CATEGORIES = [
//   { id: '국어', name: '국어', keywords: ['국어', '문학', '독서', '화법', '언어', '매체', '고전'], exclusions: ['중국어', '일본어', '외국어', '프랑스어', '스페인어', '독일어'] },
//   { id: '수학', name: '수학', keywords: ['수학', '대수', '미적', '확률', '기하', '통계', '해석'], exclusions: [] },
//   { id: '영어', name: '영어', keywords: ['영어', '영미', '독해', '회화', '심화영어'], exclusions: [] },
//   { id: '사회', name: '사회', keywords: ['사회', '윤리', '지리', '역사', '경제', '정치', '법', '세계사', '동아시아'], exclusions: [] },
//   { id: '과학', name: '과학', keywords: ['과학', '물리', '화학', '생명', '지구', '융합'], exclusions: [] },
//   { id: '한국사', name: '한국사', keywords: ['한국사'], exclusions: [] },
//   { id: '기타', name: '기타', keywords: ['중국어', '일본어', '한문', '제2외국어', '정보', '기술', '가정', '체육', '음악', '미술', '프랑스어', '독일어', '스페인어', '러시아어', '아랍어', '베트남어'], exclusions: [] }
// ];

// const ACHIEVEMENTS = ['A', 'B', 'C', 'D', 'E'];

// // --- Utility: 데이터 분석 해상도 최적화 (초정밀 파싱을 위한 무손실급 스캔 및 해상도 극대화) ---
// const optimizeFile = async (file) => {
//   if (file.type === "application/pdf") {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = () => resolve({ data: reader.result.split(',')[1], mimeType: "application/pdf" });
//       reader.onerror = reject;
//       reader.readAsDataURL(file);
//     });
//   }

//   return new Promise((resolve) => {
//     const reader = new FileReader();
//     reader.readAsDataURL(file);
//     reader.onload = (e) => {
//       const img = new Image();
//       img.src = e.target.result;
//       img.onload = () => {
//         const canvas = document.createElement('canvas');
        
//         // 정밀도 절대 극대화: 아주 미세한 소수점이나 숫자의 곡선(8, 0, 3, 9)을 완벽히 보존하기 위해 3000px로 확장
//         const MAX_WIDTH = 3000; 
//         let width = img.width;
//         let height = img.height;
//         if (width > MAX_WIDTH) {
//           height *= MAX_WIDTH / width;
//           width = MAX_WIDTH;
//         }
//         canvas.width = width;
//         canvas.height = height;
        
//         // 투명 배경 PDF/PNG 캡처본의 OCR 노이즈 차단을 위한 흰색 배경 덧칠
//         const ctx = canvas.getContext('2d', { alpha: false });
//         ctx.fillStyle = '#FFFFFF';
//         ctx.fillRect(0, 0, width, height);
        
//         ctx.imageSmoothingEnabled = true;
//         ctx.imageSmoothingQuality = 'high';
//         ctx.drawImage(img, 0, 0, width, height);
        
//         // 무손실 압축(PNG) 적용: JPEG의 손실 압축으로 인한 글자 테두리(Edge) 뭉개짐을 완벽히 차단하여 정확도 100% 지향
//         resolve({ data: canvas.toDataURL('image/png').split(',')[1], mimeType: "image/png" });
//       };
//     };
//   });
// };

// // --- GradeRow: 개별 교과 성적 행 컴포넌트 ---
// const GradeRow = React.memo(({ row, type, mode, updateRow, removeRow }) => {
//   return (
//     <tr className="hover:bg-slate-50/30 transition-colors group">
//       <td className="px-6 py-4">
//         <select 
//           value={row.semester} 
//           onChange={(e) => updateRow(row.id, 'semester', e.target.value)} 
//           className="w-full bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer"
//         >
//           {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
//         </select>
//       </td>
//       <td className="px-4 py-4">
//         <select 
//           value={row.group} 
//           onChange={(e) => updateRow(row.id, 'group', e.target.value)} 
//           className={`w-full bg-transparent border-none text-xs font-black ${type === 'relative' ? 'text-blue-700' : 'text-emerald-700'} focus:ring-0 cursor-pointer`}
//         >
//           {SUBJECT_CATEGORIES.map(g => <option key={g.id} value={g.id}>{g.id}</option>)}
//         </select>
//       </td>
//       <td className="px-4 py-4">
//         <input 
//           type="text" 
//           value={row.name} 
//           placeholder="과목" 
//           onChange={(e) => updateRow(row.id, 'name', e.target.value)} 
//           className="w-full bg-slate-100/50 border-none rounded-xl p-2.5 text-xs font-bold focus:bg-white focus:ring-2 transition-all" 
//         />
//       </td>

//       {mode === 'basic' ? (
//         <>
//           <td className="px-4 py-4"><input type="number" value={row.credits || ''} onChange={(e) => updateRow(row.id, 'credits', Number(e.target.value))} className="w-16 mx-auto bg-slate-100/50 border-none rounded-lg p-2 text-xs text-center font-bold" /></td>
//           <td className="px-4 py-4"><input type="number" value={row.score || ''} onChange={(e) => updateRow(row.id, 'score', Number(e.target.value))} className="w-16 mx-auto bg-slate-100/50 border-none rounded-lg p-2 text-xs text-center font-bold" /></td>
//           <td className="px-4 py-4"><input type="number" step="0.1" value={row.mean || ''} onChange={(e) => updateRow(row.id, 'mean', Number(e.target.value))} className="w-16 mx-auto bg-slate-100/50 border-none rounded-lg p-2 text-xs text-center font-bold" /></td>
//           <td className="px-4 py-4">
//             <select value={row.achievement} onChange={(e) => updateRow(row.id, 'achievement', e.target.value)} className="w-16 mx-auto bg-slate-100/50 border-none rounded-lg p-2 text-xs text-center font-black focus:ring-0">
//               {ACHIEVEMENTS.map(a => <option key={a} value={a}>{a}</option>)}
//             </select>
//           </td>
//           <td className="px-4 py-4 text-center">
//             {type === 'relative' ? (
//               <input type="number" min="1" max="9" value={row.grade || ''} onChange={(e) => updateRow(row.id, 'grade', Number(e.target.value))} className="w-12 mx-auto bg-blue-600 text-white border-none rounded-lg p-2 text-xs text-center font-black" />
//             ) : <span className="text-[10px] text-slate-300 italic">미산출</span>}
//           </td>
//           <td className="px-4 py-4"><input type="number" value={row.studentCount || ''} onChange={(e) => updateRow(row.id, 'studentCount', Number(e.target.value))} className="w-20 mx-auto bg-slate-100/50 border-none rounded-lg p-2 text-xs text-center font-bold" /></td>
//         </>
//       ) : (
//         <>
//           <td className="px-4 py-4 text-center font-bold text-xs text-slate-400">{row.credits}</td>
//           <td className="px-4 py-4 text-center text-xs font-bold">{type === 'relative' ? <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md">{row.grade}등급</span> : <span className="text-slate-300">-</span>}</td>
//           <td className="px-4 py-4 text-center text-xs font-bold text-slate-600">{row.achievement}</td>
//           <td className="px-2 py-4 bg-indigo-50/20"><input type="number" step="0.1" value={row.distA || ''} onChange={(e) => updateRow(row.id, 'distA', Number(e.target.value))} className="w-12 mx-auto bg-transparent border-none text-xs text-center font-bold text-indigo-700" /></td>
//           <td className="px-2 py-4 bg-indigo-50/20"><input type="number" step="0.1" value={row.distB || ''} onChange={(e) => updateRow(row.id, 'distB', Number(e.target.value))} className="w-12 mx-auto bg-transparent border-none text-xs text-center font-bold text-indigo-700" /></td>
//           <td className="px-2 py-4 bg-indigo-50/20"><input type="number" step="0.1" value={row.distC || ''} onChange={(e) => updateRow(row.id, 'distC', Number(e.target.value))} className="w-12 mx-auto bg-transparent border-none text-xs text-center font-bold text-indigo-700" /></td>
//           <td className="px-2 py-4 bg-indigo-50/20"><input type="number" step="0.1" value={row.distD || ''} onChange={(e) => updateRow(row.id, 'distD', Number(e.target.value))} className="w-12 mx-auto bg-transparent border-none text-xs text-center font-bold text-indigo-700" /></td>
//           <td className="px-2 py-4 bg-indigo-50/20"><input type="number" step="0.1" value={row.distE || ''} onChange={(e) => updateRow(row.id, 'distE', Number(e.target.value))} className="w-12 mx-auto bg-transparent border-none text-xs text-center font-bold text-indigo-700" /></td>
//         </>
//       )}

//       <td className="px-8 py-4 text-right">
//         <button onClick={() => removeRow(row.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"><Trash2 size={16} /></button>
//       </td>
//     </tr>
//   );
// });

// const TableSection = React.memo(({ title, grades, type, mode, updateRow, removeRow, addRow }) => (
//   <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
//     <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-md">
//       <h2 className="text-xl font-black text-slate-800 tracking-tight">{title}</h2>
//       <button onClick={() => addRow(type)} className={`flex items-center gap-2 ${type === 'relative' ? 'bg-blue-600' : 'bg-emerald-600'} text-white hover:opacity-90 px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-md`}>
//         <Plus size={18} /> 과목 추가
//       </button>
//     </div>
//     <div className="overflow-x-auto">
//       <table className="w-full text-left border-collapse min-w-[1200px]">
//         <thead>
//           <tr className="bg-slate-50/80 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
//             <th className="px-8 py-6">학년/학기</th>
//             <th className="px-4 py-6">교과</th>
//             <th className="px-4 py-6">과목</th>
//             {mode === 'basic' ? (
//               <>
//                 <th className="px-4 py-6 text-center w-20">학점</th>
//                 <th className="px-4 py-6 text-center w-20">원점수</th>
//                 <th className="px-4 py-6 text-center w-20">과목평균</th>
//                 <th className="px-4 py-6 text-center w-20">성취도</th>
//                 <th className="px-4 py-6 text-center w-20">석차등급</th>
//                 <th className="px-4 py-6 text-center w-24">수강자수</th>
//               </>
//             ) : (
//               <>
//                 <th className="px-4 py-6 text-center w-20">학점</th>
//                 <th className="px-4 py-6 text-center w-20">등급</th>
//                 <th className="px-4 py-6 text-center w-20">성취도</th>
//                 <th className="px-2 py-6 text-center bg-indigo-50/30 text-indigo-600 font-bold uppercase">A(%)</th>
//                 <th className="px-2 py-6 text-center bg-indigo-50/30 text-indigo-600 font-bold uppercase">B(%)</th>
//                 <th className="px-2 py-6 text-center bg-indigo-50/30 text-indigo-600 font-bold uppercase">C(%)</th>
//                 <th className="px-2 py-6 text-center bg-indigo-50/30 text-indigo-600 font-bold uppercase">D(%)</th>
//                 <th className="px-2 py-6 text-center bg-indigo-50/30 text-indigo-600 font-bold uppercase">E(%)</th>
//               </>
//             )}
//             <th className="px-8 py-6 w-12"></th>
//           </tr>
//         </thead>
//         <tbody className="divide-y divide-slate-100">
//           {grades.map((row) => (
//             <GradeRow key={row.id} row={row} type={type} mode={mode} updateRow={updateRow} removeRow={removeRow} />
//           ))}
//         </tbody>
//       </table>
//     </div>
//   </div>
// ));

// const App = () => {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [passwordInput, setPasswordInput] = useState('');
//   const [authError, setAuthError] = useState('');

//   const [grades, setGrades] = useState([
//     { 
//       id: 1, type: 'relative', semester: '1학년 1학기', group: '국어', name: '국어', 
//       credits: 4, score: 95, mean: 65.2, achievement: 'A', grade: 1, studentCount: 320,
//       distA: 15.2, distB: 22.1, distC: 30.5, distD: 20.2, distE: 12.0
//     },
//     { 
//       id: 2, type: 'relative', semester: '1학년 1학기', group: '수학', name: '수학', 
//       credits: 4, score: 98, mean: 58.7, achievement: 'A', grade: 1, studentCount: 320,
//       distA: 10.5, distB: 18.2, distC: 25.4, distD: 28.1, distE: 17.8
//     },
//     { 
//       id: 3, type: 'absolute', semester: '1학년 1학기', group: '과학', name: '과학탐구실험', 
//       credits: 1, score: 92, mean: 88.5, achievement: 'A', grade: null, studentCount: 320,
//       distA: 65.4, distB: 20.1, distC: 14.5, distD: 0, distE: 0
//     },
//   ]);

//   const [activeTab, setActiveTab] = useState('input');
//   const [isAnalyzing, setIsAnalyzing] = useState(false);
//   const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });
//   const fileInputRef = useRef(null);

//   const handlePrint = () => {
//     window.print();
//   };

//   const handleAuth = (e) => {
//     e?.preventDefault();
//     if (VALID_PASSWORDS.includes(passwordInput.toLowerCase())) {
//       setIsAuthenticated(true);
//       setAuthError('');
//     } else {
//       setAuthError('유효하지 않은 보안 코드입니다. 보안 코드를 확인해 주세요.');
//     }
//   };

//   // --- 초정밀 입시 성적표 파싱 및 데이터 맵핑 엔진 (정확도 무결성 보장 버전) ---
//   const analyzeFile = async (file) => {
//     setIsAnalyzing(true);
//     setUploadStatus({ type: 'info', message: '데이터 분석 시스템이 정밀 해독 중입니다...' });

//     try {
//       const { data: base64Data, mimeType } = await optimizeFile(file);
      
//       // AI가 성적표 구조를 명확히 인지하고 사소한 실수도 범하지 않도록 입시 전문가용 초정밀 프롬프트 적용
//       const systemPrompt = `당신은 대한민국 대학 입시 및 고등학교 나이스(NEIS) 성적표 데이터 추출을 위한 최고 수준의 비전 AI입니다.
// 이미지 내의 성적 표 데이터를 단 하나의 오차(특히 소수점)나 누락 없이 완벽하게 추출하여 JSON 배열로 반환하십시오.

// [초정밀 데이터 추출 및 검증 가이드라인]
// 1. 이미지 화질 복원 판독: 숫자 '8'과 '0', '3'과 '9', '1'과 '7', 기호 '.'(소수점)과 ','(쉼표)를 문맥에 맞게 정확히 구분하십시오. 특히 원점수, 과목평균, 성취도별 분포비율의 '소수점'은 입시 데이터의 핵심이므로 절대 누락해선 안 됩니다.
// 2. 교과 및 과목명 추출: 과목명 내부의 공백은 모두 제거하십시오 (예: "심 화 국 어" -> "심화국어").
// 3. 교과군(group) 엄격 분류: '중국어, 일본어, 프랑스어, 스페인어, 독일어, 러시아어, 아랍어, 베트남어, 한문' 등 모든 외국어/제2외국어/한문은 무조건 '기타'로 분류합니다. (절대 국어로 분류하지 마십시오)
// 4. 등급(grade) 추출: '석차등급' 열에 1~9 사이의 아라비아 숫자가 명확히 있는 경우에만 정수로 추출하십시오. 'P', '.', '-', 공란 등 숫자가 아닌 모든 값은 무조건 null로 처리하십시오.
// 5. 성취도 비율(distA ~ distE): 'A: 15.2, B: 20.1' 등의 형태로 기재된 성취도별 분포 비율을 각각 distA, distB... 필드에 숫자만(15.2) 정확히 할당하십시오. 데이터가 없는 빈칸이나 '-' 표시는 0으로 치환하십시오.
// 6. 단위 및 기호 제거: %, 명, 점 등의 단위와 불필요한 특수기호는 모두 제거하고 순수 숫자(Number) 타입으로 추출하십시오.
// 7. 학기 정규화: "1학년 1학기" 형식으로 텍스트를 통일하십시오. 1학년 1학기부터 3학년 2학기까지 표에 존재하는 모든 행을 전수 조사하여 누락 없이 추출하십시오.
// 8. 출력 제약: 오직 지정된 JSON Schema 구조만을 따르며, 어떠한 마크다운 양식(\`\`\`json 등)이나 부연 설명 없이 순수한 JSON 객체 문자열만 출력하십시오.`;

//       const prompt = "성적표 이미지를 초정밀 스캔하여 지정된 입시 전문가용 JSON 규격에 맞춰 100% 정확하게 전수 추출하십시오.";

//       const generationConfig = {
//         // Temperature를 0.0으로 고정하여 AI 모델의 창의성을 배제하고 기계적으로 가장 높은 정확도의 추출치 보장
//         temperature: 0.0, 
//         topK: 1,
//         // 성적표 데이터가 길 경우 응답 데이터가 잘리는 현상(Truncation)을 막기 위해 토큰 용량을 15000으로 여유있게 할당
//         maxOutputTokens: 15000, 
//         responseMimeType: "application/json",
//         responseSchema: {
//           type: "OBJECT",
//           properties: {
//             grades: {
//               type: "ARRAY",
//               items: {
//                 type: "OBJECT",
//                 properties: {
//                   semester: { type: "STRING" },
//                   group: { type: "STRING" },
//                   name: { type: "STRING" },
//                   credits: { type: "NUMBER" },
//                   score: { type: "NUMBER" },
//                   mean: { type: "NUMBER" },
//                   achievement: { type: "STRING" },
//                   grade: { type: "NUMBER", nullable: true },
//                   studentCount: { type: "NUMBER" },
//                   distA: { type: "NUMBER" },
//                   distB: { type: "NUMBER" },
//                   distC: { type: "NUMBER" },
//                   distD: { type: "NUMBER" },
//                   distE: { type: "NUMBER" }
//                 },
//                 required: ["name", "semester"]
//               }
//             }
//           },
//           required: ["grades"]
//         }
//       };

//       const payload = {
//         contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: mimeType, data: base64Data } }] }],
//         systemInstruction: { parts: [{ text: systemPrompt }] },
//         generationConfig: generationConfig
//       };

//       const callApiWithRetry = async (retries = 0) => {
//         const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(payload)
//         });
        
//         if (!response.ok) {
//           if (retries < 3) {
//             const delay = Math.pow(2, retries) * 1000;
//             await new Promise(res => setTimeout(res, delay));
//             return callApiWithRetry(retries + 1);
//           }
//           throw new Error('데이터 추출 서버 응답 지연');
//         }
//         return await response.json();
//       };

//       const result = await callApiWithRetry();
//       let rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
//       if (!rawText) throw new Error('추출된 데이터 응답이 비어 있습니다.');
      
//       // JSON 파싱 안정성 처리
//       let cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

//       let rawGrades = [];
//       try {
//         const parsedData = JSON.parse(cleanedText);
//         rawGrades = parsedData.grades || [];
//       } catch (e) {
//         console.warn("JSON Parse Error, Running High-Speed Regex Recovery...");
//         const objectPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
//         const matches = cleanedText.match(objectPattern);
//         if (matches) {
//           matches.forEach(m => {
//             try {
//               let safeObj = m;
//               if (safeObj.split('{').length > safeObj.split('}').length) safeObj += '}'.repeat(safeObj.split('{').length - safeObj.split('}').length);
//               const obj = JSON.parse(safeObj);
//               if (obj.name || obj.semester) rawGrades.push(obj);
//             } catch (innerE) {}
//           });
//         }
//       }

//       if (rawGrades.length > 0) {
//         // --- 고속 정밀 시맨틱 매핑 엔진 ---
//         const cachedOtherCat = SUBJECT_CATEGORIES.find(c => c.id === '기타');

//         const mappedGrades = rawGrades.map((item, index) => {
//           // 수치 추출의 안정성 보장: 소수점을 완벽히 유지하며 쉼표(,) 오인식을 소수점(.)으로 2차 교정 필터링
//           const parseSafeNum = (val, def = 0) => {
//             if (val === null || val === undefined || val === '' || val === '-') return def;
//             let strVal = String(val).replace(/,/g, '.'); // OCR이 소수점을 쉼표로 읽었을 경우 사전 교정
//             const clean = strVal.replace(/[^0-9.-]/g, '');
//             const num = parseFloat(clean);
//             return isNaN(num) ? def : num;
//           };

//           let sem = String(item.semester || '').trim();
//           const semNumMatch = sem.match(/([1-3])\s*[학년|-]?\s*([1-2])\s*[학기]?/);
//           if (semNumMatch) {
//             sem = `${semNumMatch[1]}학년 ${semNumMatch[2]}학기`;
//           } else if (!SEMESTERS.includes(sem)) {
//             sem = SEMESTERS.find(s => s.replace(/\s/g, '').includes(sem.replace(/\s/g, ''))) || '1학년 1학기';
//           }

//           let subjName = String(item.name || '').trim();
//           let rawSubjNameForMatch = subjName.replace(/\s+/g, '');
//           let grp = String(item.group || '').replace(/\s+/g, '');
          
//           let finalGroup = '기타';
//           const isOther = cachedOtherCat.keywords.some(k => rawSubjNameForMatch.includes(k));
          
//           if (!isOther) {
//             for (let i = 0; i < SUBJECT_CATEGORIES.length; i++) {
//               const cat = SUBJECT_CATEGORIES[i];
//               if (cat.id === '기타') continue;
//               if (!cat.exclusions.some(ex => rawSubjNameForMatch.includes(ex)) && 
//                   (cat.keywords.some(k => rawSubjNameForMatch.includes(k) || grp.includes(k)))) {
//                 finalGroup = cat.id;
//                 break;
//               }
//             }
//           }

//           let gVal = item.grade;
//           let isRelative = false;
//           const gNum = parseSafeNum(gVal, null);
//           if (gNum !== null && gNum >= 1 && gNum <= 9) {
//             gVal = gNum;
//             isRelative = true;
//           } else {
//             gVal = null;
//           }

//           let ach = String(item.achievement || 'A').toUpperCase().replace(/[^A-E]/g, '');
//           ach = ach.length > 0 ? ach.charAt(0) : 'A';

//           return { 
//             id: Date.now() + index + Math.random(),
//             type: isRelative ? 'relative' : 'absolute',
//             semester: sem,
//             group: finalGroup,
//             name: subjName || '미상 과목',
//             credits: parseSafeNum(item.credits, 1),
//             score: parseSafeNum(item.score, 0),
//             mean: parseSafeNum(item.mean, 0),
//             achievement: ach,
//             grade: gVal,
//             studentCount: parseSafeNum(item.studentCount, 0),
//             distA: parseSafeNum(item.distA, 0),
//             distB: parseSafeNum(item.distB, 0),
//             distC: parseSafeNum(item.distC, 0),
//             distD: parseSafeNum(item.distD, 0),
//             distE: parseSafeNum(item.distE, 0)
//           };
//         });

//         setGrades(mappedGrades);
//         setUploadStatus({ type: 'success', message: `데이터 정밀 분석 완료: ${mappedGrades.length}개의 데이터가 정확하게 연동되었습니다.` });
//       } else {
//         throw new Error('성적표 양식을 인식할 수 없습니다. 더 선명한 파일을 업로드해 주세요.');
//       }
//     } catch (error) {
//       console.error("Precision Parsing Error:", error);
//       setUploadStatus({ type: 'error', message: '데이터 추출 중 오류가 발생했습니다. 이미지 상태를 확인해 주세요.' });
//     } finally {
//       setIsAnalyzing(false);
//     }
//   };

//   const handleFileUpload = (e) => {
//     const file = e.target.files[0];
//     const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"];
//     if (file && allowedTypes.includes(file.type)) {
//       analyzeFile(file);
//     } else if (file) {
//       setUploadStatus({ type: 'error', message: '지원되지 않는 파일 형식입니다.' });
//     }
//   };

//   const updateRow = useCallback((id, field, value) => {
//     setGrades(prev => prev.map(g => {
//         if (g.id === id) {
//             const newRow = { ...g, [field]: value };
//             if (field === 'grade') {
//                 const num = parseInt(value, 10);
//                 if (!isNaN(num) && num >= 1 && num <= 9) { newRow.type = 'relative'; } 
//                 else { newRow.type = 'absolute'; }
//             }
//             return newRow;
//         }
//         return g;
//     }));
//   }, []);

//   const removeRow = useCallback((id) => {
//     setGrades(prev => prev.filter(g => g.id !== id));
//   }, []);

//   const addRow = useCallback((type) => {
//     setGrades(prev => [...prev, {
//       id: Date.now(),
//       type: type,
//       semester: '1학년 1학기',
//       group: '국어',
//       name: '',
//       credits: 1,
//       score: 0,
//       mean: 0,
//       achievement: 'A',
//       studentCount: 0,
//       grade: type === 'relative' ? 1 : null,
//       distA: 0, distB: 0, distC: 0, distD: 0, distE: 0
//     }]);
//   }, []);

//   const analysis = useMemo(() => {
//     const normalizeStr = (str) => String(str || '').replace(/\s+/g, '');
//     const isMatchSem = (gSem, targetSem) => normalizeStr(gSem) === normalizeStr(targetSem);
//     const isMatchYear = (gSem, targetYear) => normalizeStr(gSem).startsWith(normalizeStr(targetYear));
//     const isMatchGroup = (gGroup, targets) => gGroup && targets.some(t => normalizeStr(gGroup).includes(normalizeStr(t)));

//     const relativeGrades = grades.filter(g => g.type === 'relative' && g.grade !== null && !isNaN(parseFloat(g.grade)) && parseFloat(g.grade) >= 1 && parseFloat(g.grade) <= 9);
    
//     const calculateWeightedAvg = (items) => {
//       if (!items || items.length === 0) return "-";
//       let totalCredits = 0, weightedSum = 0, validCount = 0;
//       for (const item of items) {
//           const c = parseFloat(item.credits);
//           const g = parseFloat(item.grade);
//           if (!isNaN(c) && !isNaN(g) && c > 0 && g >= 1 && g <= 9) {
//               totalCredits += c;
//               weightedSum += (c * g);
//               validCount++;
//           }
//       }
//       return (validCount > 0 && totalCredits > 0) ? (weightedSum / totalCredits).toFixed(2) : "-";
//     };

//     const rowDefs = [
//       { label: '전교과', filter: () => true },
//       { label: '국수영사과', filter: (g) => isMatchGroup(g.group, ['국어', '수학', '영어', '사회', '과학', '한국사']) },
//       { label: '국수영사', filter: (g) => isMatchGroup(g.group, ['국어', '수학', '영어', '사회', '한국사']) },
//       { label: '국수영과', filter: (g) => isMatchGroup(g.group, ['국어', '수학', '영어', '과학']) },
//       { label: '국어', filter: (g) => isMatchGroup(g.group, ['국어']) },
//       { label: '수학', filter: (g) => isMatchGroup(g.group, ['수학']) },
//       { label: '영어', filter: (g) => isMatchGroup(g.group, ['영어']) },
//       { label: '사회', filter: (g) => isMatchGroup(g.group, ['사회', '한국사']) },
//       { label: '과학', filter: (g) => isMatchGroup(g.group, ['과학']) },
//     ];

//     return {
//       semesterMatrix: rowDefs.map(d => ({ 
//         label: d.label, 
//         all: calculateWeightedAvg(relativeGrades.filter(d.filter)), 
//         ...SEMESTERS.reduce((acc, s) => ({ ...acc, [s]: calculateWeightedAvg(relativeGrades.filter(d.filter).filter(g => isMatchSem(g.semester, s))) }), {}) 
//       })),
//       gradeMatrix: rowDefs.map(d => ({ 
//         label: d.label, 
//         all: calculateWeightedAvg(relativeGrades.filter(d.filter)), 
//         ...YEARS.reduce((acc, y) => ({ ...acc, [y]: calculateWeightedAvg(relativeGrades.filter(d.filter).filter(g => isMatchYear(g.semester, y))) }), {}) 
//       }))
//     };
//   }, [grades]);

//   if (!isAuthenticated) {
//     return (
//       <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
//         <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-10 relative">
//           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
//           <div className="relative z-10 text-center">
//             <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
//               <Lock className="text-white" size={40} />
//             </div>
//             <h1 className="text-2xl font-black text-slate-800 mb-2">보안 코드 인증</h1>
//             <p className="text-slate-500 text-sm font-medium mb-8">
//               데이터 분석 시스템입니다.<br/>접근을 위해 보안 코드를 입력해 주세요.
//             </p>
//             <form onSubmit={handleAuth} className="space-y-4">
//               <div className="relative">
//                 <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//                 <input 
//                   type="password"
//                   placeholder="보안 코드 입력"
//                   value={passwordInput}
//                   onChange={(e) => setPasswordInput(e.target.value)}
//                   className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300"
//                 />
//               </div>
//               {authError && (
//                 <div className="flex items-center gap-2 text-red-500 text-xs font-bold justify-center animate-bounce">
//                   <AlertCircle size={14} />
//                   {authError}
//                 </div>
//               )}
//               <button 
//                 type="submit"
//                 className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3"
//               >
//                 <ShieldCheck size={24} />
//                 시스템 접속
//               </button>
//             </form>
//             <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
//               Secured by IpsiSketch Data Lab
//             </p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
//       <header className="max-w-[1450px] mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
//             <GraduationCap className="text-blue-600" size={36} />
//             내신 성적 정밀 분석 시스템
//           </h1>
//           <p className="text-slate-500 mt-1 font-medium ml-1">내신 성적 분석 엔진 및 정밀 리포트</p>
//         </div>
//         <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-200 print:hidden">
//           <button onClick={() => setActiveTab('input')} className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'input' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}`}>데이터 입력</button>
//           <button onClick={() => setActiveTab('analysis')} className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'analysis' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}`}>정밀 리포트</button>
//         </div>
//       </header>

//       <main className="max-w-[1450px] mx-auto">
//         {activeTab === 'input' ? (
//           <div className="space-y-12">
//             <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
//                 <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
//                 <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
//                     <div className="max-w-2xl">
//                         <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
//                             <FileUp size={32} className="text-blue-400" />
//                             데이터 정밀 추출
//                         </h2>
//                         <p className="text-slate-300 text-lg leading-relaxed">
//                             나이스 성적표 <span className="text-blue-300 font-bold underline underline-offset-4">파일(PDF)</span>을 업로드하세요. <br/>
//                             전 학년 성적 데이터를 고속 스캔하여 전 영역을 정밀하게 추출합니다.
//                         </p>
//                     </div>
//                     <div className="flex flex-col items-center gap-4 shrink-0">
//                         <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={handleFileUpload} ref={fileInputRef} className="hidden" />
//                         <button 
//                             disabled={isAnalyzing}
//                             onClick={() => fileInputRef.current?.click()}
//                             className="bg-white text-blue-900 px-14 py-5 rounded-[1.5rem] font-black shadow-xl hover:bg-blue-50 hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 text-lg"
//                         >
//                             {isAnalyzing ? <Loader2 className="animate-spin" /> : <FileUp size={24} />}
//                             {isAnalyzing ? '데이터 고속 전수 분석 중...' : '성적표 파일 업로드'}
//                         </button>
//                     </div>
//                 </div>
//                 {uploadStatus.message && (
//                   <div className={`mt-8 p-5 rounded-2xl flex items-center gap-4 text-sm font-bold ${uploadStatus.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : uploadStatus.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-white/10 text-blue-200 border border-white/20'}`}>
//                     {uploadStatus.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
//                     {uploadStatus.message}
//                   </div>
//                 )}
//             </div>

//             <div className="space-y-10">
//               <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 ml-2">
//                 <Layers className="text-blue-600" size={28} />
//                 교과 성적 데이터 관리
//               </h2>
//               <TableSection title="상대평가 (석차등급)" type="relative" mode="basic" grades={grades.filter(g => g.type === 'relative')} updateRow={updateRow} removeRow={removeRow} addRow={addRow} />
//               <TableSection title="절대평가 (성취도)" type="absolute" mode="basic" grades={grades.filter(g => g.type === 'absolute')} updateRow={updateRow} removeRow={removeRow} addRow={addRow} />
//               <TableSection title="성취도별 분포 비율 진단" type="relative" mode="distribution" grades={grades} updateRow={updateRow} removeRow={removeRow} addRow={addRow} />
//             </div>
//           </div>
//         ) : (
//           <div className="space-y-12 pb-24 print:pb-0 print:space-y-8 print:pt-4">
//             <div className="flex justify-end print:hidden">
//               <button 
//                 onClick={handlePrint}
//                 className="flex items-center gap-3 bg-slate-800 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-slate-700 transition-all active:scale-95 group"
//               >
//                 <Printer size={22} className="group-hover:animate-pulse" /> 
//                 정밀 리포트 출력
//               </button>
//             </div>

//             <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden print:shadow-xl print:border-slate-200 print:break-inside-avoid">
//                 <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-white">
//                     <div className="p-3 bg-blue-50 rounded-2xl print:hidden">
//                         <TableIcon className="text-blue-600" size={24} />
//                     </div>
//                     <h2 className="text-2xl font-black text-slate-800">내신성적 정밀 분석표 (학기별)</h2>
//                 </div>
//                 <div className="overflow-x-auto">
//                     <table className="w-full text-left border-collapse">
//                         <thead>
//                             <tr className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-widest border-b border-slate-200">
//                                 <th className="px-8 py-5 border-r border-slate-100">교과</th>
//                                 <th className="px-6 py-5 text-center bg-blue-50/50 text-blue-700 border-r border-slate-100 font-black">전학년</th>
//                                 {SEMESTERS.map(sem => <th key={sem} className="px-6 py-5 text-center border-r border-slate-100 whitespace-nowrap">{sem}</th>)}
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y divide-slate-100">
//                             {analysis.semesterMatrix.map((row, idx) => (
//                                 <tr key={idx} className={`${idx < 4 ? 'bg-slate-50/30' : ''} hover:bg-blue-50/30 transition-colors`}>
//                                     <td className={`px-8 py-4 font-bold text-sm border-r border-slate-100 ${idx < 4 ? 'text-blue-900' : 'text-slate-600'}`}>{row.label}</td>
//                                     <td className="px-6 py-4 text-center font-black text-blue-600 bg-blue-50/10 border-r border-slate-100">{row.all}</td>
//                                     {SEMESTERS.map(sem => <td key={sem} className="px-6 py-4 text-center text-sm font-semibold text-slate-700 border-r border-slate-100">{row[sem]}</td>)}
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>

//             <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden print:shadow-xl print:border-slate-200 print:break-inside-avoid">
//                 <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-white">
//                     <div className="p-3 bg-indigo-50 rounded-2xl print:hidden">
//                         <Layers className="text-indigo-600" size={24} />
//                     </div>
//                     <h2 className="text-2xl font-black text-slate-800">내신성적 정밀 분석표 (학년별)</h2>
//                 </div>
//                 <div className="overflow-x-auto">
//                     <table className="w-full text-left border-collapse">
//                         <thead>
//                             <tr className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-widest border-b border-slate-200">
//                                 <th className="px-8 py-5 border-r border-slate-100">교과</th>
//                                 <th className="px-6 py-5 text-center bg-indigo-50/50 text-indigo-700 border-r border-slate-100 font-black">전학년</th>
//                                 {YEARS.map(year => <th key={year} className="px-10 py-5 text-center border-r border-slate-100 whitespace-nowrap">{year} 전체</th>)}
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y divide-slate-100">
//                             {analysis.gradeMatrix.map((row, idx) => (
//                                 <tr key={idx} className={`${idx < 4 ? 'bg-indigo-50/10' : ''} hover:bg-indigo-50/30 transition-colors`}>
//                                     <td className={`px-8 py-4 font-bold text-sm border-r border-slate-100 ${idx < 4 ? 'text-indigo-900' : 'text-slate-600'}`}>{row.label}</td>
//                                     <td className="px-6 py-4 text-center font-black text-indigo-600 bg-indigo-50/10 border-r border-slate-100">{row.all}</td>
//                                     {YEARS.map(year => <td key={year} className="px-10 py-4 text-center text-sm font-semibold text-slate-700 border-r border-slate-100">{row[year]}</td>)}
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//           </div>
//         )}
//       </main>
//       <footer className="max-w-[1450px] mx-auto mt-20 py-10 border-t border-slate-200 text-center text-slate-400 text-sm font-bold print:hidden">
//         &copy; Admissions Data IpsiSketch Lab. All Rights Reserved.
//       </footer>
      
//       {/* 프린트 스타일 */}
//       <style>{`
//         @page {
//           size: A4 portrait;
//           margin: 12mm;
//         }
//         @media print {
//           html, body { 
//             background-color: #f8fafc !important; /* 화면과 동일한 부드러운 그레이톤 배경 유지 */
//             -webkit-print-color-adjust: exact !important;
//             print-color-adjust: exact !important;
//           }
//           .min-h-screen { 
//             background-color: #f8fafc !important; 
//           }
//           /* A4 한 장에 테이블이 완벽히 들어가도록 여백 및 스케일 동적 조정 */
//           main { 
//             max-width: 100% !important; 
//             padding: 0 !important;
//             margin: 0 auto !important;
//             zoom: 0.95; /* 한 페이지 인쇄 최적화 비율 */
//           }
//           /* 표 데이터에만 시선이 집중되도록 상단 타이틀 숨김 처리 */
//           header { display: none !important; }
//           .print\\:hidden { display: none !important; }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default App;










import React, { useState, useMemo, useRef, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  GraduationCap, 
  FileUp, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Lock, 
  Key, 
  ShieldCheck, 
  Table as TableIcon,
  Printer
} from 'lucide-react';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
const MODEL_NAME = "gemini-2.5-flash";

const rawPasswords = import.meta.env.VITE_VALID_PASSWORDS || "";
const VALID_PASSWORDS = rawPasswords.split(',').map(p => p.trim().toLowerCase());

const SEMESTERS = [
  '1학년 1학기', '1학년 2학기', 
  '2학년 1학기', '2학년 2학기', 
  '3학년 1학기', '3학년 2학기'
];

const YEARS = ['1학년', '2학년', '3학년'];

const SUBJECT_CATEGORIES = [
  { id: '국어', name: '국어', keywords: ['국어', '문학', '독서', '화법', '언어', '매체', '고전'], exclusions: ['중국어', '일본어', '외국어', '프랑스어', '스페인어', '독일어'] },
  { id: '수학', name: '수학', keywords: ['수학', '대수', '미적', '확률', '기하', '통계', '해석'], exclusions: [] },
  { id: '영어', name: '영어', keywords: ['영어', '영미', '독해', '회화', '심화영어'], exclusions: [] },
  { id: '사회', name: '사회', keywords: ['사회', '윤리', '지리', '역사', '경제', '정치', '법', '세계사', '동아시아'], exclusions: [] },
  { id: '과학', name: '과학', keywords: ['과학', '물리', '화학', '생명', '지구', '융합'], exclusions: [] },
  { id: '한국사', name: '한국사', keywords: ['한국사'], exclusions: [] },
  { id: '기타', name: '기타', keywords: ['중국어', '일본어', '한문', '제2외국어', '정보', '기술', '가정', '체육', '음악', '미술', '프랑스어', '독일어', '스페인어', '러시아어', '아랍어', '베트남어'], exclusions: [] }
];

const ACHIEVEMENTS = ['A', 'B', 'C', 'D', 'E'];

// // --- Mba'eporu: Ta'ãnga ñembopya'e ha ñemyesakã (Pya'eve ha hesakãve haguã) ---
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
        
        // // Ñemyesakã porãve haguã ta'ãnga (2400px). Ko'ãva ombopya'e AI ñehesa'ỹijo ha oñongatu umi kyta michĩva.
        const MAX_WIDTH = 2400; 
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        
        // // Ñembogue alpha ñembopya'e haguã ha ñemopotĩ morotĩme
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.filter = 'contrast(1.2) grayscale(100%)';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // // Ta'ãnga porãveha (JPEG 0.92) pya'eve haguã API-pe (Oñemomichĩ 5-kue ta'ãnga pohýi)
        resolve({ data: canvas.toDataURL('image/jpeg', 0.92).split(',')[1], mimeType: "image/jpeg" });
      };
    };
  });
};

// // --- GradeRow: Mbo'epy ñemohenda ---
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
    { 
      id: 1, type: 'relative', semester: '1학년 1학기', group: '국어', name: '국어', 
      credits: 4, score: 95, mean: 65.2, achievement: 'A', grade: 1, studentCount: 320,
      distA: 15.2, distB: 22.1, distC: 30.5, distD: 20.2, distE: 12.0
    },
    { 
      id: 2, type: 'relative', semester: '1학년 1학기', group: '수학', name: '수학', 
      credits: 4, score: 98, mean: 58.7, achievement: 'A', grade: 1, studentCount: 320,
      distA: 10.5, distB: 18.2, distC: 25.4, distD: 28.1, distE: 17.8
    },
    { 
      id: 3, type: 'absolute', semester: '1학년 1학기', group: '과학', name: '과학탐구실험', 
      credits: 1, score: 92, mean: 88.5, achievement: 'A', grade: null, studentCount: 320,
      distA: 65.4, distB: 20.1, distC: 14.5, distD: 0, distE: 0
    },
  ]);

  const [activeTab, setActiveTab] = useState('input');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });
  const fileInputRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const handleAuth = (e) => {
    e?.preventDefault();
    if (VALID_PASSWORDS.includes(passwordInput.toLowerCase())) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('유효하지 않은 보안 코드입니다. 보안 코드를 확인해 주세요.');
    }
  };

  // // --- AI ñehesa'ỹijo pya'e ha hekopete (Pya'eve ha hesakãve) ---
  const analyzeFile = async (file) => {
    setIsAnalyzing(true);
    setUploadStatus({ type: 'info', message: '데이터 분석 시스템이 초고속 정밀 해독 중입니다...' });

    try {
      const { data: base64Data, mimeType } = await optimizeFile(file);
      
      // // Ñe'ẽmbyky hekopete AI-pe guarã (절대 누락 방지 및 초정밀 추출 10계명)
      const systemPrompt = `당신은 대한민국 대학 입시 및 고등학교 나이스(NEIS) 성적표 데이터 추출을 위한 최고 수준의 비전 AI입니다.
이미지 내의 성적 표(Table) 데이터를 단 하나의 오차나 누락 없이 100% 완벽하게 추출하여 JSON 배열로 반환하십시오.

[초고속 정밀 데이터 추출 및 절대 누락 방지 10계명]
1. 전수 조사 엄수 (가장 중요): 1학년부터 3학년까지 이미지에 존재하는 '모든 교과 성적 행(Row)'을 위에서 아래로 단 한 줄도 빠짐없이 끝까지 추출하십시오. 데이터 항목이 수십 개라도 절대 요약, 생략, 중단하지 마십시오.
2. 해독 최우선순위(소수점): 원점수, 과목평균, 성취도별 분포비율(A~E)에 포함된 '소수점(.)'을 절대 누락하지 마십시오. 8과 0, 3과 9의 오인식에 극도로 주의하십시오.
3. 빈칸 및 하이픈 처리: 데이터가 없는 빈칸이나 가로줄('-')은 무조건 숫자 0으로 치환하십시오.
4. 과목명 정규화: 과목명 내부의 모든 띄어쓰기는 완전히 제거하여 추출하십시오. (예: "심 화 국 어" -> "심화국어")
5. 교과 분류 예외(필수): '중국어, 일본어, 프랑스어, 스페인어, 독일어, 러시아어, 아랍어, 베트남어, 한문' 등 모든 외국어 및 한문 교과는 무조건 '기타'로 분류하십시오. (국어 아님)
6. 석차등급(grade) 엄격화: 석차등급 칸에 1~9 사이의 명시적인 '숫자'가 있을 때만 정수로 추출하십시오. 'P', '.', '-', 공란 등 숫자가 아닌 모든 값은 무조건 null로 처리하십시오.
7. 성취도 비율(distA~E): A부터 E까지 5개의 분포 비율 숫자를 찾아 각각 필드에 정확히 매핑하십시오. 빈칸이나 '-'는 0으로 치환하십시오.
8. 수치 데이터 클렌징: %, 명, 점 등의 기호와 단위는 완전히 제거하고 순수 숫자(Number) 타입으로만 추출하십시오.
9. 학기 정규화: 표의 헤더를 판독하여 반드시 "N학년 N학기" 형식의 텍스트로 통일하십시오.
10. 출력 제약: 오직 지정된 JSON Schema 구조만을 따르며, 마크다운이나 추가 설명 없이 순수한 JSON 문자열만 출력하십시오.`;

      const prompt = "성적표 이미지를 초정밀 스캔하여 지정된 입시 전문가용 JSON 규격에 맞춰 100% 정확하게 전수 추출하십시오. 절대 누락하지 마십시오.";

      const generationConfig = {
        // // Temperature 0-pe, mba'e añetete ha pya'e
        temperature: 0.0, 
        topK: 1,
        // // Token hetave ani haguã oikytĩ (15000). 데이터가 아무리 많아도 절대 잘리지 않도록 안전 공간 확보
        maxOutputTokens: 15000, 
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            grades: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  semester: { type: "STRING" },
                  group: { type: "STRING" },
                  name: { type: "STRING" },
                  credits: { type: "NUMBER" },
                  score: { type: "NUMBER" },
                  mean: { type: "NUMBER" },
                  achievement: { type: "STRING" },
                  grade: { type: "NUMBER", nullable: true },
                  studentCount: { type: "NUMBER" },
                  distA: { type: "NUMBER" },
                  distB: { type: "NUMBER" },
                  distC: { type: "NUMBER" },
                  distD: { type: "NUMBER" },
                  distE: { type: "NUMBER" }
                },
                required: ["name", "semester"]
              }
            }
          },
          required: ["grades"]
        }
      };

      const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: mimeType, data: base64Data } }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: generationConfig
      };

      const callApiWithRetry = async (retries = 0) => {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          // // Ñeha'ã jey pya'e (응답 대기 병목을 줄이기 위한 재시도 최적화)
          if (retries < 2) {
            const delay = Math.pow(2, retries) * 1000;
            await new Promise(res => setTimeout(res, delay));
            return callApiWithRetry(retries + 1);
          }
          throw new Error('데이터 추출 서버 응답 지연');
        }
        return await response.json();
      };

      const result = await callApiWithRetry();
      let rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) throw new Error('추출된 데이터 응답이 비어 있습니다.');
      
      // // JSON ñemopotĩ pya'e
      let cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

      let rawGrades = [];
      try {
        const parsedData = JSON.parse(cleanedText);
        rawGrades = parsedData.grades || [];
      } catch (e) {
        // // Ñemohenda jey jejavy oiko ramo
        console.warn("JSON Parse Error, Running High-Speed Regex Recovery...");
        const objectPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
        const matches = cleanedText.match(objectPattern);
        if (matches) {
          matches.forEach(m => {
            try {
              let safeObj = m;
              if (safeObj.split('{').length > safeObj.split('}').length) safeObj += '}'.repeat(safeObj.split('{').length - safeObj.split('}').length);
              const obj = JSON.parse(safeObj);
              if (obj.name || obj.semester) rawGrades.push(obj);
            } catch (innerE) {}
          });
        }
      }

      if (rawGrades.length > 0) {
        // // --- Ñemohenda pya'e ha hekopete ---
        const cachedOtherCat = SUBJECT_CATEGORIES.find(c => c.id === '기타');

        const mappedGrades = rawGrades.map((item, index) => {
          // // Ñemopotĩ papaha: 2중 방어벽. 소수점을 보존하고 공백 및 기호를 완벽 제거
          const parseSafeNum = (val, def = 0) => {
            if (val === null || val === undefined || val === '' || val === '-' || val === '.' || String(val).trim().toUpperCase() === 'P') return def;
            
            // 쉼표를 소수점으로 변환하고 띄어쓰기 등 공백 노이즈 제거
            let strVal = String(val).replace(/,/g, '.').replace(/\s+/g, '');
            
            // 괄호 및 괄호 안의 모든 내용 강제 삭제
            strVal = strVal.replace(/\([^)]*\)/g, '');
            
            // 숫자와 소수점 이외의 문자 필터링
            let clean = strVal.replace(/[^0-9.]/g, '');
            
            if (clean === '') return def;

            // 소수점 2중 인식 노이즈 방어 (예: 12.3.4 -> 12.34)
            const parts = clean.split('.');
            if (parts.length > 2) {
              clean = parts[0] + '.' + parts.slice(1).join('');
            }
            
            const num = parseFloat(clean);
            return isNaN(num) ? def : num;
          };

          let sem = String(item.semester || '').trim();
          const semNumMatch = sem.match(/([1-3])\s*[학년|-]?\s*([1-2])\s*[학기]?/);
          if (semNumMatch) {
            sem = `${semNumMatch[1]}학년 ${semNumMatch[2]}학기`;
          } else if (!SEMESTERS.includes(sem)) {
            sem = SEMESTERS.find(s => s.replace(/\s/g, '').includes(sem.replace(/\s/g, ''))) || '1학년 1학기';
          }

          // // Ñembogue paite pa'ũ ñembojoja haguã
          let subjName = String(item.name || '').trim();
          let rawSubjNameForMatch = subjName.replace(/\s+/g, '');
          let grp = String(item.group || '').replace(/\s+/g, '');
          
          // // Ñepyrũ '기타' rehe pya'eve haguã (O(n) 연산 단축)
          let finalGroup = '기타';
          const isOther = cachedOtherCat.keywords.some(k => rawSubjNameForMatch.includes(k));
          
          if (!isOther) {
            for (let i = 0; i < SUBJECT_CATEGORIES.length; i++) {
              const cat = SUBJECT_CATEGORIES[i];
              if (cat.id === '기타') continue;
              if (!cat.exclusions.some(ex => rawSubjNameForMatch.includes(ex)) && 
                  (cat.keywords.some(k => rawSubjNameForMatch.includes(k) || grp.includes(k)))) {
                finalGroup = cat.id;
                break;
              }
            }
          }

          let gVal = item.grade;
          let isRelative = false;
          const gNum = parseSafeNum(gVal, null);
          if (gNum !== null && gNum >= 1 && gNum <= 9) {
            gVal = gNum;
            isRelative = true;
          } else {
            gVal = null;
          }

          let ach = String(item.achievement || 'A').toUpperCase().replace(/[^A-E]/g, '');
          ach = ach.length > 0 ? ach.charAt(0) : 'A';

          return { 
            id: Date.now() + index + Math.random(),
            type: isRelative ? 'relative' : 'absolute',
            semester: sem,
            group: finalGroup,
            name: subjName || '미상 과목',
            credits: parseSafeNum(item.credits, 1),
            score: parseSafeNum(item.score, 0),
            mean: parseSafeNum(item.mean, 0),
            achievement: ach,
            grade: gVal,
            studentCount: parseSafeNum(item.studentCount, 0),
            distA: parseSafeNum(item.distA, 0),
            distB: parseSafeNum(item.distB, 0),
            distC: parseSafeNum(item.distC, 0),
            distD: parseSafeNum(item.distD, 0),
            distE: parseSafeNum(item.distE, 0)
          };
        });

        setGrades(mappedGrades);
        setUploadStatus({ type: 'success', message: `데이터 정밀 분석 완료: ${mappedGrades.length}개의 데이터가 누락 없이 연동되었습니다.` });
      } else {
        throw new Error('성적표 양식을 인식할 수 없습니다. 더 선명한 파일을 업로드해 주세요.');
      }
    } catch (error) {
      console.error("Precision Parsing Error:", error);
      setUploadStatus({ type: 'error', message: '데이터 추출 중 오류가 발생했습니다. 이미지 상태를 확인해 주세요.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (file && allowedTypes.includes(file.type)) {
      analyzeFile(file);
    } else if (file) {
      setUploadStatus({ type: 'error', message: '지원되지 않는 파일 형식입니다.' });
    }
  };

  const updateRow = useCallback((id, field, value) => {
    setGrades(prev => prev.map(g => {
        if (g.id === id) {
            const newRow = { ...g, [field]: value };
            if (field === 'grade') {
                const num = parseInt(value, 10);
                if (!isNaN(num) && num >= 1 && num <= 9) { newRow.type = 'relative'; } 
                else { newRow.type = 'absolute'; }
            }
            return newRow;
        }
        return g;
    }));
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
      score: 0,
      mean: 0,
      achievement: 'A',
      studentCount: 0,
      grade: type === 'relative' ? 1 : null,
      distA: 0, distB: 0, distC: 0, distD: 0, distE: 0
    }]);
  }, []);

  // // --- Ñemboheko NaN ojejoko haguã ---
  const analysis = useMemo(() => {
    const normalizeStr = (str) => String(str || '').replace(/\s+/g, '');
    const isMatchSem = (gSem, targetSem) => normalizeStr(gSem) === normalizeStr(targetSem);
    const isMatchYear = (gSem, targetYear) => normalizeStr(gSem).startsWith(normalizeStr(targetYear));
    const isMatchGroup = (gGroup, targets) => gGroup && targets.some(t => normalizeStr(gGroup).includes(normalizeStr(t)));

    const relativeGrades = grades.filter(g => g.type === 'relative' && g.grade !== null && !isNaN(parseFloat(g.grade)) && parseFloat(g.grade) >= 1 && parseFloat(g.grade) <= 9);
    
    const calculateWeightedAvg = (items) => {
      if (!items || items.length === 0) return "-";
      let totalCredits = 0, weightedSum = 0, validCount = 0;
      for (const item of items) {
          const c = parseFloat(item.credits);
          const g = parseFloat(item.grade);
          if (!isNaN(c) && !isNaN(g) && c > 0 && g >= 1 && g <= 9) {
              totalCredits += c;
              weightedSum += (c * g);
              validCount++;
          }
      }
      return (validCount > 0 && totalCredits > 0) ? (weightedSum / totalCredits).toFixed(2) : "-";
    };

    const rowDefs = [
      { label: '전교과', filter: () => true },
      { label: '국수영사과', filter: (g) => isMatchGroup(g.group, ['국어', '수학', '영어', '사회', '과학', '한국사']) },
      { label: '국수영사', filter: (g) => isMatchGroup(g.group, ['국어', '수학', '영어', '사회', '한국사']) },
      { label: '국수영과', filter: (g) => isMatchGroup(g.group, ['국어', '수학', '영어', '과학']) },
      { label: '국어', filter: (g) => isMatchGroup(g.group, ['국어']) },
      { label: '수학', filter: (g) => isMatchGroup(g.group, ['수학']) },
      { label: '영어', filter: (g) => isMatchGroup(g.group, ['영어']) },
      { label: '사회', filter: (g) => isMatchGroup(g.group, ['사회', '한국사']) },
      { label: '과학', filter: (g) => isMatchGroup(g.group, ['과학']) },
    ];

    return {
      semesterMatrix: rowDefs.map(d => ({ 
        label: d.label, 
        all: calculateWeightedAvg(relativeGrades.filter(d.filter)), 
        ...SEMESTERS.reduce((acc, s) => ({ ...acc, [s]: calculateWeightedAvg(relativeGrades.filter(d.filter).filter(g => isMatchSem(g.semester, s))) }), {}) 
      })),
      gradeMatrix: rowDefs.map(d => ({ 
        label: d.label, 
        all: calculateWeightedAvg(relativeGrades.filter(d.filter)), 
        ...YEARS.reduce((acc, y) => ({ ...acc, [y]: calculateWeightedAvg(relativeGrades.filter(d.filter).filter(g => isMatchYear(g.semester, y))) }), {}) 
      }))
    };
  }, [grades]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-10 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
              <Lock className="text-white" size={40} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 mb-2">보안 코드 인증</h1>
            <p className="text-slate-500 text-sm font-medium mb-8">
              데이터 분석 시스템입니다.<br/>접근을 위해 보안 코드를 입력해 주세요.
            </p>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password"
                  placeholder="보안 코드 입력"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300"
                />
              </div>
              {authError && (
                <div className="flex items-center gap-2 text-red-500 text-xs font-bold justify-center animate-bounce">
                  <AlertCircle size={14} />
                  {authError}
                </div>
              )}
              <button 
                type="submit"
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3"
              >
                <ShieldCheck size={24} />
                시스템 접속
              </button>
            </form>
            <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Secured by IpsiSketch Data Lab
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <header className="max-w-[1450px] mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <GraduationCap className="text-blue-600" size={36} />
            내신 성적 정밀 분석 시스템
          </h1>
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
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <FileUp size={32} className="text-blue-400" />
                            데이터 정밀 추출
                        </h2>
                        <p className="text-slate-300 text-lg leading-relaxed">
                            나이스 성적표 <span className="text-blue-300 font-bold underline underline-offset-4">파일(PDF)</span>을 업로드하세요. <br/>
                            전 학년 성적 데이터를 고속 스캔하여 전 영역을 정밀하게 추출합니다.
                        </p>
                    </div>
                    <div className="flex flex-col items-center gap-4 shrink-0">
                        <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={handleFileUpload} ref={fileInputRef} className="hidden" />
                        <button 
                            disabled={isAnalyzing}
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white text-blue-900 px-14 py-5 rounded-[1.5rem] font-black shadow-xl hover:bg-blue-50 hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 text-lg"
                        >
                            {isAnalyzing ? <Loader2 className="animate-spin" /> : <FileUp size={24} />}
                            {isAnalyzing ? '데이터 고속 전수 분석 중...' : '성적표 파일 업로드'}
                        </button>
                    </div>
                </div>
                {uploadStatus.message && (
                  <div className={`mt-8 p-5 rounded-2xl flex items-center gap-4 text-sm font-bold ${uploadStatus.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : uploadStatus.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-white/10 text-blue-200 border border-white/20'}`}>
                    {uploadStatus.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    {uploadStatus.message}
                  </div>
                )}
            </div>

            <div className="space-y-10">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 ml-2">
                <Layers className="text-blue-600" size={28} />
                교과 성적 데이터 관리
              </h2>
              <TableSection title="상대평가 (석차등급)" type="relative" mode="basic" grades={grades.filter(g => g.type === 'relative')} updateRow={updateRow} removeRow={removeRow} addRow={addRow} />
              <TableSection title="절대평가 (성취도)" type="absolute" mode="basic" grades={grades.filter(g => g.type === 'absolute')} updateRow={updateRow} removeRow={removeRow} addRow={addRow} />
              <TableSection title="성취도별 분포 비율 진단" type="relative" mode="distribution" grades={grades} updateRow={updateRow} removeRow={removeRow} addRow={addRow} />
            </div>
          </div>
        ) : (
          <div className="space-y-12 pb-24 print:pb-0 print:space-y-8 print:pt-4">
            <div className="flex justify-end print:hidden">
              <button 
                onClick={handlePrint}
                className="flex items-center gap-3 bg-slate-800 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-slate-700 transition-all active:scale-95 group"
              >
                <Printer size={22} className="group-hover:animate-pulse" /> 
                정밀 리포트 출력
              </button>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden print:shadow-xl print:border-slate-200 print:break-inside-avoid">
                <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-white">
                    <div className="p-3 bg-blue-50 rounded-2xl print:hidden">
                        <TableIcon className="text-blue-600" size={24} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">내신성적 정밀 분석표 (학기별)</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-widest border-b border-slate-200">
                                <th className="px-8 py-5 border-r border-slate-100">교과</th>
                                <th className="px-6 py-5 text-center bg-blue-50/50 text-blue-700 border-r border-slate-100 font-black">전학년</th>
                                {SEMESTERS.map(sem => <th key={sem} className="px-6 py-5 text-center border-r border-slate-100 whitespace-nowrap">{sem}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {analysis.semesterMatrix.map((row, idx) => (
                                <tr key={idx} className={`${idx < 4 ? 'bg-slate-50/30' : ''} hover:bg-blue-50/30 transition-colors`}>
                                    <td className={`px-8 py-4 font-bold text-sm border-r border-slate-100 ${idx < 4 ? 'text-blue-900' : 'text-slate-600'}`}>{row.label}</td>
                                    <td className="px-6 py-4 text-center font-black text-blue-600 bg-blue-50/10 border-r border-slate-100">{row.all}</td>
                                    {SEMESTERS.map(sem => <td key={sem} className="px-6 py-4 text-center text-sm font-semibold text-slate-700 border-r border-slate-100">{row[sem]}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden print:shadow-xl print:border-slate-200 print:break-inside-avoid">
                <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-white">
                    <div className="p-3 bg-indigo-50 rounded-2xl print:hidden">
                        <Layers className="text-indigo-600" size={24} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">내신성적 정밀 분석표 (학년별)</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-widest border-b border-slate-200">
                                <th className="px-8 py-5 border-r border-slate-100">교과</th>
                                <th className="px-6 py-5 text-center bg-indigo-50/50 text-indigo-700 border-r border-slate-100 font-black">전학년</th>
                                {YEARS.map(year => <th key={year} className="px-10 py-5 text-center border-r border-slate-100 whitespace-nowrap">{year} 전체</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {analysis.gradeMatrix.map((row, idx) => (
                                <tr key={idx} className={`${idx < 4 ? 'bg-indigo-50/10' : ''} hover:bg-indigo-50/30 transition-colors`}>
                                    <td className={`px-8 py-4 font-bold text-sm border-r border-slate-100 ${idx < 4 ? 'text-indigo-900' : 'text-slate-600'}`}>{row.label}</td>
                                    <td className="px-6 py-4 text-center font-black text-indigo-600 bg-indigo-50/10 border-r border-slate-100">{row.all}</td>
                                    {YEARS.map(year => <td key={year} className="px-10 py-4 text-center text-sm font-semibold text-slate-700 border-r border-slate-100">{row[year]}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        )}
      </main>
      <footer className="max-w-[1450px] mx-auto mt-20 py-10 border-t border-slate-200 text-center text-slate-400 text-sm font-bold print:hidden">
        &copy; Admissions Data IpsiSketch Lab. All Rights Reserved.
      </footer>
      
      {/* 프린트 스타일 */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 12mm;
        }
        @media print {
          html, body { 
            background-color: #f8fafc !important; /* 화면과 동일한 부드러운 그레이톤 배경 유지 */
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header { margin-bottom: 20px !important; }
          main { 
            max-width: 100% !important; 
            padding: 0 !important;
            margin: 0 auto !important;
            zoom: 0.95; /* 한 페이지 인쇄 최적화 비율 */
          }
          .min-h-screen { 
            background-color: #f8fafc !important; 
          }
          table { width: 100% !important; border: 1px solid #e2e8f0 !important; }
          th, td { border: 1px solid #e2e8f0 !important; color: black !important; }
          .bg-slate-900, .bg-blue-600, .bg-indigo-600 { color: black !important; background: transparent !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default App;