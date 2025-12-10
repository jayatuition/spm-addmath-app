import React, { useState, useEffect } from 'react';
import { BookOpen, Trophy, ChevronRight, Clock, CheckCircle, XCircle, RotateCcw, Settings, Upload, Download, Plus, Trash2, Edit, Eye, EyeOff } from 'lucide-react';

// Topic metadata
const TOPICS_METADATA = {
  form4: {
    title: "Form 4 Topics",
    topics: [
      { id: 'form4-functions', name: 'Functions', description: 'Composite functions, inverse functions' },
      { id: 'form4-quadratic-equations', name: 'Quadratic Equations', description: 'Solving, discriminant, roots' },
      { id: 'form4-quadratic-functions', name: 'Quadratic Functions', description: 'Graphs, max/min points, axis of symmetry' },
      { id: 'form4-indices-logarithms', name: 'Indices & Logarithms', description: 'Laws of indices and logarithms' }
    ]
  },
  form5: {
    title: "Form 5 Topics",
    topics: [
      { id: 'form5-progressions', name: 'Progressions', description: 'Arithmetic and geometric progressions' },
      { id: 'form5-integration', name: 'Integration', description: 'Indefinite and definite integration' },
      { id: 'form5-vectors', name: 'Vectors', description: 'Vector operations, magnitude, unit vectors' },
      { id: 'form5-probability', name: 'Probability', description: 'Basic probability, independent events' }
    ]
  }
};

// Initial sample questions
const INITIAL_QUESTIONS = {
  "form4-functions": [
    {
      id: 'f1',
      question: 'Given that f(x) = 3x - 2 and g(x) = x² + 1, find fg(2).',
      options: ['13', '15', '17', '19'],
      correct: 0,
      explanation: 'First find g(2) = 2² + 1 = 5. Then find f(5) = 3(5) - 2 = 13.',
      diagram: null
    }
  ]
};

export default function SPMAddMathApp() {
  const [questionsData, setQuestionsData] = useState(() => {
    const saved = localStorage.getItem('spm-questions');
    return saved ? JSON.parse(saved) : INITIAL_QUESTIONS;
  });
  
  const [adminMode, setAdminMode] = useState(false);
  const [authCode, setauthCode] = useState('');
  const [ showAuthPrompt, set showAuthPrompt] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [numQuestions, setNumQuestions] = useState(5);
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Admin states
  const [editingTopic, setEditingTopic] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correct: 0,
    explanation: '',
    diagram: null
  });

  useEffect(() => {
    localStorage.setItem('spm-questions', JSON.stringify(questionsData));
  }, [questionsData]);

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAuth = () => {
  // Accept any password for now - you can add proper authentication later
  if (authCode.length >= 5) {
    setAdminMode(true);
    set showAuthPrompt(false);
    setauthCode('');
  } else {
    alert('Access code must be at least 5 characters');
  }
};

  const handleFileUpload = async (e, topicId) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      
      if (file.name.endsWith('.csv')) {
        parseCSV(text, topicId);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        alert('For Excel files, please save as CSV first and upload');
      }
    };
    
    reader.readAsText(file);
  };

  const parseCSV = (text, topicId) => {
    const lines = text.split('\n').filter(line => line.trim());
    const questions = [];
    
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(part => part.trim().replace(/^"|"$/g, ''));
      
      if (parts.length >= 7) {
        questions.push({
          id: `q_${Date.now()}_${i}`,
          question: parts[0],
          options: [parts[1], parts[2], parts[3], parts[4]],
          correct: parseInt(parts[5]) || 0,
          explanation: parts[6],
          diagram: parts[7] || null
        });
      }
    }

    if (questions.length > 0) {
      setQuestionsData(prev => ({
        ...prev,
        [topicId]: [...(prev[topicId] || []), ...questions]
      }));
      alert(`Successfully imported ${questions.length} questions!`);
    }
  };

  const downloadCSVTemplate = () => {
    const csv = `Question,Option A,Option B,Option C,Option D,Correct Answer (0-3),Explanation,Diagram URL (optional)
"Find the value of x if 2x + 5 = 11","x = 3","x = 2","x = 4","x = 5",0,"Solve: 2x = 11 - 5 = 6, so x = 3",""
"What is 5² ?","20","25","30","15",1,"5² = 5 × 5 = 25",""`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question-template.csv';
    a.click();
  };

  const downloadAllQuestions = () => {
    const json = JSON.stringify(questionsData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spm-questions-backup.json';
    a.click();
  };

  const addNewQuestion = (topicId) => {
    if (!newQuestion.question || newQuestion.options.some(opt => !opt)) {
      alert('Please fill in all fields');
      return;
    }

    const question = {
      id: `q_${Date.now()}`,
      ...newQuestion
    };

    setQuestionsData(prev => ({
      ...prev,
      [topicId]: [...(prev[topicId] || []), question]
    }));

    setNewQuestion({
      question: '',
      options: ['', '', '', ''],
      correct: 0,
      explanation: '',
      diagram: null
    });

    alert('Question added successfully!');
  };

  const deleteQuestion = (topicId, questionId) => {
    if (confirm('Are you sure you want to delete this question?')) {
      setQuestionsData(prev => ({
        ...prev,
        [topicId]: prev[topicId].filter(q => q.id !== questionId)
      }));
    }
  };

  const handleDiagramUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewQuestion(prev => ({
          ...prev,
          diagram: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getRandomQuestions = (topicId, count) => {
    const allQuestions = questionsData[topicId] || [];
    const availableCount = allQuestions.length;
    const questionsToGet = Math.min(count, availableCount);
    
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, questionsToGet);
  };

  const handleFormSelect = (form) => {
    setSelectedForm(form);
    setSelectedTopicId(null);
    setShowSettings(false);
    setEditingTopic(null);
  };

  const handleTopicSelect = (topicId) => {
    if (adminMode) {
      setEditingTopic(topicId);
    } else {
      setSelectedTopicId(topicId);
      setShowSettings(true);
    }
  };

  const startPractice = () => {
    const questions = getRandomQuestions(selectedTopicId, numQuestions);
    setPracticeQuestions(questions);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAnsweredQuestions([]);
    setTimeSpent(0);
    setIsTimerRunning(true);
    setShowSettings(false);
  };

  const handleAnswerSelect = (index) => {
    if (showExplanation) return;
    
    setSelectedAnswer(index);
    const currentQuestion = practiceQuestions[currentQuestionIndex];
    const isCorrect = index === currentQuestion.correct;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    setAnsweredQuestions(prev => [...prev, {
      question: currentQuestion.question,
      correct: isCorrect,
      userAnswer: index,
      correctAnswer: currentQuestion.correct
    }]);
    
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < practiceQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setIsTimerRunning(false);
    }
  };

  const handleReset = () => {
    setSelectedTopicId(null);
    setPracticeQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAnsweredQuestions([]);
    setTimeSpent(0);
    setIsTimerRunning(false);
    setShowSettings(false);
  };

  const isQuizComplete = practiceQuestions.length > 0 && currentQuestionIndex === practiceQuestions.length - 1 && showExplanation;

  const getTopicInfo = (topicId) => {
    for (const form of Object.values(TOPICS_METADATA)) {
      const topic = form.topics.find(t => t.id === topicId);
      if (topic) return topic;
    }
    return null;
  };

  const selectedTopic = selectedTopicId ? getTopicInfo(selectedTopicId) : null;
  const availableQuestions = selectedTopicId ? (questionsData[selectedTopicId]?.length || 0) : 0;

  // Admin Panel
  if (adminMode && editingTopic) {
    const topic = getTopicInfo(editingTopic);
    const topicQuestions = questionsData[editingTopic] || [];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => setEditingTopic(null)}
              className="text-purple-600 hover:text-purple-800 flex items-center"
            >
              ← Back to Topics
            </button>
            <button
              onClick={() => setAdminMode(false)}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center"
            >
              <EyeOff className="w-4 h-4 mr-2" />
              Exit Admin
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Admin Panel - {topic?.name}
            </h2>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <button
                onClick={downloadCSVTemplate}
                className="bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 flex items-center justify-center"
              >
                <Download className="w-5 h-5 mr-2" />
                Download CSV Template
              </button>

              <label className="bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 flex items-center justify-center cursor-pointer">
                <Upload className="w-5 h-5 mr-2" />
                Import CSV File
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e, editingTopic)}
                  className="hidden"
                />
              </label>

              <button
                onClick={downloadAllQuestions}
                className="bg-purple-500 text-white px-4 py-3 rounded-lg hover:bg-purple-600 flex items-center justify-center"
              >
                <Download className="w-5 h-5 mr-2" />
                Backup All Questions
              </button>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
              <h3 className="font-bold text-yellow-900 mb-2">CSV Format Instructions:</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Column 1: Question text</li>
                <li>• Columns 2-5: Four answer options (A, B, C, D)</li>
                <li>• Column 6: Correct answer index (0 for A, 1 for B, 2 for C, 3 for D)</li>
                <li>• Column 7: Explanation</li>
                <li>• Column 8: Diagram URL (optional - leave empty if not needed)</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Plus className="w-6 h-6 mr-2" />
              Add New Question
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Question:</label>
                <textarea
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  rows="3"
                  placeholder="Enter your question here..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {newQuestion.options.map((opt, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Option {String.fromCharCode(65 + idx)}:
                    </label>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...newQuestion.options];
                        newOpts[idx] = e.target.value;
                        setNewQuestion(prev => ({ ...prev, options: newOpts }));
                      }}
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder={`Enter option ${String.fromCharCode(65 + idx)}`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Correct Answer:</label>
                <select
                  value={newQuestion.correct}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, correct: parseInt(e.target.value) }))}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                >
                  <option value={0}>Option A</option>
                  <option value={1}>Option B</option>
                  <option value={2}>Option C</option>
                  <option value={3}>Option D</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Explanation:</label>
                <textarea
                  value={newQuestion.explanation}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  rows="2"
                  placeholder="Explain the solution step by step..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Diagram (Optional):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDiagramUpload}
                  className="w-full p-2 border-2 border-gray-300 rounded-lg"
                />
                {newQuestion.diagram && (
                  <img src={newQuestion.diagram} alt="Diagram preview" className="mt-2 max-w-xs rounded-lg" />
                )}
              </div>

              <button
                onClick={() => addNewQuestion(editingTopic)}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-semibold"
              >
                Add Question
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Existing Questions ({topicQuestions.length})
            </h3>

            <div className="space-y-4">
              {topicQuestions.map((q, idx) => (
                <div key={q.id} className="border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-800">Q{idx + 1}: {q.question}</h4>
                    <button
                      onClick={() => deleteQuestion(editingTopic, q.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  {q.diagram && (
                    <img src={q.diagram} alt="Question diagram" className="max-w-xs rounded-lg mb-2" />
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {q.options.map((opt, i) => (
                      <div key={i} className={`p-2 rounded ${i === q.correct ? 'bg-green-100 font-semibold' : 'bg-gray-50'}`}>
                        {String.fromCharCode(65 + i)}: {opt}
                      </div>
                    ))}
                  </div>
                 </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Password prompt
  // Simple admin confirmation
if (showAuthPrompt && !adminMode) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Admin Access</h2>
        <p className="mb-4">Enter your access code to manage questions.</p>
        <input
          type="text"
          value={authCode}
          onChange={(e) => setAuthCode(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
          placeholder="Access code"
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={handleAuth}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold"
          >
            Continue
          </button>
          <button
            onClick={() => setShowAuthPrompt(false)}
            className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
  // Home screen
  if (!selectedForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div></div>
            <button
              onClick={() => set showAuthPrompt(true)}
              className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm"
            >
              <Eye className="w-4 h-4 mr-1" />
              Admin
            </button>
          </div>

          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="w-16 h-16 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">SPM Additional Mathematics</h1>
            <p className="text-gray-600">Practice questions for SPM Add Math preparation</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div 
              onClick={() => handleFormSelect('form4')}
              className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105"
            >
              <h2 className="text-2xl font-bold text-indigo-600 mb-4">Form 4</h2>
              <ul className="space-y-2 text-gray-700">
                {TOPICS_METADATA.form4.topics.map(topic => (
                  <li key={topic.id} className="flex items-center">
                    <ChevronRight className="w-4 h-4 mr-2 text-indigo-500" />
                    {topic.name}
                  </li>
                ))}
              </ul>
              <div className="mt-6 text-sm text-gray-500">
                {TOPICS_METADATA.form4.topics.reduce((sum, t) => sum + (questionsData[t.id]?.length || 0), 0)} questions available
              </div>
            </div>

            <div 
              onClick={() => handleFormSelect('form5')}
              className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105"
            >
              <h2 className="text-2xl font-bold text-purple-600 mb-4">Form 5</h2>
              <ul className="space-y-2 text-gray-700">
                {TOPICS_METADATA.form5.topics.map(topic => (
                  <li key={topic.id} className="flex items-center">
                    <ChevronRight className="w-4 h-4 mr-2 text-purple-500" />
                    {topic.name}
                  </li>
                ))}
              </ul>
              <div className="mt-6 text-sm text-gray-500">
                {TOPICS_METADATA.form5.topics.reduce((sum, t) => sum + (questionsData[t.id]?.length || 0), 0)} questions available
              </div>
            </div>
          </div>

          <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">How It Works</h3>
            <ol className="space-y-2 text-gray-600">
              <li>1. Select Form 4 or Form 5</li>
              <li>2. Choose a topic to practice</li>
              <li>3. Select how many questions you want</li>
              <li>4. Answer questions and get instant feedback with explanations</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Topic selection or practice mode continues...
  if (!selectedTopicId || showSettings) {
    const formData = TOPICS_METADATA[selectedForm];
    
    if (showSettings && selectedTopic) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
          <div className="max-w-2xl mx-auto">
            <button 
              onClick={() => {
                setShowSettings(false);
                setSelectedTopicId(null);
              }}
              className="mb-6 text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              ← Back to Topics
            </button>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <Settings className="w-8 h-8 text-indigo-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-800">Practice Settings</h2>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{selectedTopic.name}</h3>
                <p className="text-gray-600">{selectedTopic.description}</p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <p className="text-blue-800">
                  <strong>{availableQuestions} questions</strong> available for this topic
                </p>
              </div>

              <div className="mb-8">
                <label className="block text-gray-700 font-semibold mb-3">
                  How many questions do you want to practice?
                </label>
                <input
                  type="number"
                  min="1"
                  max={availableQuestions}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Math.min(Math.max(1, parseInt(e.target.value) || 1), availableQuestions))}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-lg"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Choose between 1 and {availableQuestions} questions
                </p>
              </div>

              <button
                onClick={startPractice}
                disabled={numQuestions < 1 || numQuestions > availableQuestions}
                className="w-full bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Start Practice
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => setSelectedForm(null)}
            className="mb-6 text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            ← Back to Form Selection
          </button>

          <h1 className="text-3xl font-bold text-gray-800 mb-8">{formData.title}</h1>

          <div className="grid md:grid-cols-2 gap-4">
            {formData.topics.map(topic => (
              <div 
                key={topic.id}
                onClick={() => handleTopicSelect(topic.id)}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-2">{topic.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{topic.description}</p>
                <p className="text-gray-600 text-sm">{questionsData[topic.id]?.length || 0} questions available</p>
                <div className="mt-4 text-indigo-600 flex items-center">
                  {adminMode ? 'Manage Questions' : 'Start Practice'} <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = practiceQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / practiceQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={handleReset}
          className="mb-6 text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          ← Back to Topics
        </button>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">{selectedTopic.name}</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center text-gray-600">
                <Clock className="w-5 h-5 mr-2" />
                {formatTime(timeSpent)}
              </div>
              <div className="flex items-center text-gray-600">
                <Trophy className="w-5 h-5 mr-2" />
                {score}/{practiceQuestions.length}
              </div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Question {currentQuestionIndex + 1} of {practiceQuestions.length}
          </p>
        </div>

        {!isQuizComplete ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              {currentQuestion.question}
            </h3>

            {currentQuestion.diagram && (
              <div className="mb-6 flex justify-center">
                <img 
                  src={currentQuestion.diagram} 
                  alt="Question diagram" 
                  className="max-w-full rounded-lg shadow-md"
                  style={{ maxHeight: '300px' }}
                />
              </div>
            )}

            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, index) => {
                let bgColor = 'bg-gray-50 hover:bg-gray-100';
                let borderColor = 'border-gray-200';
                
                if (showExplanation) {
                  if (index === currentQuestion.correct) {
                    bgColor = 'bg-green-50';
                    borderColor = 'border-green-500';
                  } else if (index === selectedAnswer && index !== currentQuestion.correct) {
                    bgColor = 'bg-red-50';
                    borderColor = 'border-red-500';
                  }
                } else if (selectedAnswer === index) {
                  bgColor = 'bg-indigo-50';
                  borderColor = 'border-indigo-500';
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showExplanation}
                    className={`w-full p-4 rounded-lg border-2 ${borderColor} ${bgColor} text-left transition-all flex items-center justify-between ${!showExplanation && 'hover:shadow-md'}`}
                  >
                    <span className="font-medium text-gray-800">{option}</span>
                    {showExplanation && index === currentQuestion.correct && (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    )}
                    {showExplanation && index === selectedAnswer && index !== currentQuestion.correct && (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <h4 className="font-bold text-blue-900 mb-2">Explanation:</h4>
                <p className="text-blue-800">{currentQuestion.explanation}</p>
              </div>
            )}

            {showExplanation && (
              <button
                onClick={handleNextQuestion}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                {currentQuestionIndex < practiceQuestions.length - 1 ? 'Next Question' : 'View Results'}
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz Complete!</h2>
              <p className="text-gray-600">Great job on completing this topic!</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-indigo-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Score</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {Math.round((score / practiceQuestions.length) * 100)}%
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Correct</p>
                <p className="text-3xl font-bold text-green-600">{score}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Time</p>
                <p className="text-3xl font-bold text-blue-600">{formatTime(timeSpent)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  const questions = getRandomQuestions(selectedTopicId, numQuestions);
                  setPracticeQuestions(questions);
                  setCurrentQuestionIndex(0);
                  setSelectedAnswer(null);
                  setShowExplanation(false);
                  setScore(0);
                  setAnsweredQuestions([]);
                  setTimeSpent(0);
                  setIsTimerRunning(true);
                }}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold flex items-center justify-center"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Retry This Topic
              </button>
              <button
                onClick={handleReset}
                className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Choose Another Topic
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}