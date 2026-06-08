const MODEL_URL = "https://teachablemachine.withgoogle.com/models/imjCzBMzE/";
let aiModel, totalClasses;

const imageSelector = document.getElementById('image-selector');
const imagePreview = document.getElementById('image-preview');
const uploadPrompt = document.getElementById('upload-prompt');
const btnAnalyze = document.getElementById('btn-analyze');
const loadingSpinner = document.getElementById('loading');
const resultPlaceholder = document.getElementById('result-placeholder');
const resultContainer = document.getElementById('result-container');
const labelContainer = document.getElementById('label-container');
const summaryContainer = document.getElementById('summary-container');
const summaryText = document.getElementById('summary-text');
const dropZone = document.getElementById('drop-zone');

async function loadAIModel() {
    try {
        const modelJSON = MODEL_URL + "model.json";
        const metadataJSON = MODEL_URL + "metadata.json";
        
        aiModel = await tmImage.load(modelJSON, metadataJSON);
        totalClasses = aiModel.getTotalClasses();
        console.log("ระบบพร้อมใช้งาน: โหลด AI Model สำเร็จเรียบร้อย");
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดโมเดล:", error);
        alert("ไม่สามารถเชื่อมต่อโมเดล AI ได้ กรุณาตรวจสอบอินเทอร์เน็ต");
    }
}

loadAIModel();

function handleFileSelect(file) {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(event) {
            imagePreview.src = event.target.result;
            imagePreview.classList.remove('hidden');
            uploadPrompt.classList.add('hidden');
            btnAnalyze.disabled = false;
            
            resultPlaceholder.classList.remove('hidden');
            resultContainer.classList.add('hidden');
            summaryContainer.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    } else {
        alert("กรุณาเลือกไฟล์ที่เป็นรูปภาพเท่านั้นครับ");
    }
}

imageSelector.addEventListener('change', (e) => {
    handleFileSelect(e.target.files[0]);
});

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over-active');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over-active');
    }, false);
});

dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFileSelect(files[0]);
});

btnAnalyze.addEventListener('click', async () => {
    if (!aiModel) return alert("โมเดล AI ยังกำลังโหลดอยู่ กรุณารออีกสักครู่ครับ");
    
    resultPlaceholder.classList.add('hidden');
    resultContainer.classList.add('hidden');
    summaryContainer.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');
    btnAnalyze.disabled = true;

    setTimeout(async () => {
        const prediction = await aiModel.predict(imagePreview);
        renderAnalysisResults(prediction);
    }, 800);
});

function renderAnalysisResults(predictions) {
    loadingSpinner.classList.add('hidden');
    resultContainer.classList.remove('hidden');
    summaryContainer.classList.remove('hidden');
    btnAnalyze.disabled = false;
    
    labelContainer.innerHTML = '';
    predictions.sort((a, b) => b.probability - a.probability);

    predictions.forEach((pred, index) => {
        const percentage = (pred.probability * 100).toFixed(1);
        const barColor = index === 0 ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : 'bg-gray-700';
        const textColor = index === 0 ? 'text-cyan-400 font-bold' : 'text-gray-400';

        const resultRow = `
            <div class="space-y-1">
                <div class="flex justify-between text-sm">
                    <span class="${textColor}">${pred.className}</span>
                    <span class="cyber-font ${textColor}">${percentage}%</span>
                </div>
                <div class="w-full bg-black/40 rounded-full h-3 overflow-hidden p-[2px] border border-gray-800">
                    <div class="${barColor} h-full rounded-full progress-bar-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
        labelContainer.innerHTML += resultRow;
    });

    const topClass = predictions[0];
    const topConfidence = (topClass.probability * 100).toFixed(1);

    if (topConfidence > 75) {
        summaryText.innerHTML = `ระบบ AI ตรวจพบและมีความมั่นใจสูงมาก (<span class="text-cyan-400 font-semibold">${topConfidence}%</span>) ว่าภาพนี้คือ <span class="text-fuchsia-400 font-bold text-base">"${topClass.className}"</span> ผลการประมวลผลจัดอยู่ในเกณฑ์แม่นยำสูงมาก`;
    } else if (topConfidence > 45) {
        summaryText.innerHTML = `ระบบ AI คาดเดาว่าภาพนี้มีแนวโน้มที่จะเป็น <span class="text-fuchsia-400 font-bold">"${topClass.className}"</span> (<span class="text-cyan-400">ระดับความมั่นใจปานกลาง ${topConfidence}%</span>) แนะนำให้ใช้รูปภาพมุมอื่นหรือสว่างขึ้นเพื่อตรวจสอบซ้ำ`;
    } else {
        summaryText.innerHTML = `ไม่สามารถจำแนกภาพได้อย่างชัดเจน เนื่องจากความแม่นยำต่ำกว่าเกณฑ์มาตรฐาน อย่างไรก็ตาม ค่าความเป็นไปได้มากที่สุดคือ <span class="text-fuchsia-400 font-bold">"${topClass.className}"</span> (${topConfidence}%)`;
    }
}