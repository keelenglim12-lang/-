// 全局變量
console.log('JavaScript 開始載入...');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentReminder = null;
let checkInterval = null;
let audioContext = null;
let alarmOscillator = null;
let currentDate = new Date();
let selectedDate = new Date();
let recentTasks = JSON.parse(localStorage.getItem('recentTasks')) || [];
let notificationQueue = [];
let isNotificationShowing = false;

// 勵志文字相關變量
let inspirationQuotes = [];
let currentQuoteIndex = 0;
let quoteChangeInterval = null;

console.log('全局變量初始化完成');

// 常用任務數據
const quickTasks = [
    {
        id: 'work',
        title: '工作會議',
        content: '完成工作會議討論',
        location: '會議室',
        icon: 'fas fa-users',
        defaultTime: '09:00-10:00'
    },
    {
        id: 'exercise',
        title: '運動健身',
        content: '完成30分鐘運動鍛煉',
        location: '健身房',
        icon: 'fas fa-dumbbell',
        defaultTime: '18:00'
    },
    {
        id: 'study',
        title: '學習進修',
        content: '學習新技能或知識',
        location: '書房',
        icon: 'fas fa-book',
        defaultTime: '20:00-21:00'
    },
    {
        id: 'meal',
        title: '用餐時間',
        content: '享用營養餐點',
        location: '餐廳',
        icon: 'fas fa-utensils',
        defaultTime: '12:00'
    },
    {
        id: 'break',
        title: '休息放鬆',
        content: '放鬆身心休息',
        location: '客廳',
        icon: 'fas fa-couch',
        defaultTime: '15:00-15:30'
    },
    {
        id: 'shopping',
        title: '購物採買',
        content: '購買所需日常用品',
        location: '超市',
        icon: 'fas fa-shopping-cart',
        defaultTime: '16:00'
    },
    {
        id: 'reading',
        title: '閱讀時間',
        content: '閱讀指定書籍或文章',
        location: '書房',
        icon: 'fas fa-book-open',
        defaultTime: '21:00'
    },
    {
        id: 'planning',
        title: '計劃安排',
        content: '制定明日詳細計劃',
        location: '書桌',
        icon: 'fas fa-clipboard-list',
        defaultTime: '22:00'
    }
];

// 初始化常用任務（從localStorage讀取用戶自定義的常用任務）
let userQuickTasks = JSON.parse(localStorage.getItem('userQuickTasks')) || [];
let allQuickTasks = [...quickTasks, ...userQuickTasks];

// DOM 元素
const currentDateEl = document.getElementById('currentDate');
const taskList = document.getElementById('taskList');
const reminderModal = document.getElementById('reminderModal');
const closeModal = document.getElementById('closeModal');
const confirmTaskBtn = document.getElementById('confirmTask');
const alarmSound = document.getElementById('alarmSound');
const calendarTitle = document.getElementById('calendarTitle');
const calendarDays = document.getElementById('calendarDays');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const scheduleDateDisplay = document.getElementById('scheduleDateDisplay');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 載入完成，開始初始化...');
    
    updateCurrentDate();
    initializeCalendar();
    renderTasks();
    startTimeCheck();
    
    // 每分鐘更新一次日期
    setInterval(updateCurrentDate, 60000);
    
    // 初始化音頻上下文（需要用戶交互）
    document.addEventListener('click', function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        document.removeEventListener('click', initAudio);
    }, { once: true });
    
    // 載入勵志文字
    console.log('準備載入勵志文字...');
    // 立即執行，不等待
    loadInspirationQuotes().catch(error => {
        console.error('勵志文字載入失敗:', error);
    });
    
    // 添加測試鈴聲按鈕（開發用）
    addTestAlarmButton();
    

    

    
    // 更新進度統計
    updateProgressStats();
    
    // 日曆事件監聽器
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
});

// 添加測試鈴聲按鈕
function addTestAlarmButton() {
    const testButton = document.createElement('button');
    testButton.textContent = '🔔 測試';
    testButton.id = 'testAlarmBtn';
    testButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--accent-primary);
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 8px;
        cursor: pointer;
        z-index: 1000;
        font-size: 14px;
        transition: all 0.3s ease;
    `;
    
    let isPlaying = false;
    
    testButton.onclick = function() {
        if (!isPlaying) {
            // 開始播放
            playAlarm();
            isPlaying = true;
            testButton.textContent = '🔇 停止';
            testButton.style.background = 'var(--danger)';
            showNotification('測試播放中', 'info');
            
            // 5秒後自動停止
            setTimeout(() => {
                if (isPlaying) {
                    stopAlarm();
                    isPlaying = false;
                    testButton.textContent = '🔔 測試';
                    testButton.style.background = 'var(--accent-primary)';
                    showNotification('測試已自動停止', 'info');
                }
            }, 5000);
        } else {
            // 停止播放
            stopAlarm();
            isPlaying = false;
            testButton.textContent = '🔔 測試';
            testButton.style.background = 'var(--accent-primary)';
            showNotification('測試已停止', 'info');
        }
    };
    
    document.body.appendChild(testButton);
}

// 更新當前日期顯示
function updateCurrentDate() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        weekday: 'long' 
    };
    currentDateEl.textContent = now.toLocaleDateString('zh-TW', options);
}

// 初始化日曆
function initializeCalendar() {
    renderCalendar();
    updateSelectedDateDisplay();
}

// 渲染日曆
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 更新日曆標題
    calendarTitle.textContent = `${year}年${month + 1}月`;
    
    // 獲取當月第一天和最後一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 獲取當月第一天是星期幾（0是星期日）
    const firstDayWeek = firstDay.getDay();
    
    // 清空日曆
    calendarDays.innerHTML = '';
    
    // 添加上個月的日期
    const prevMonthLastDay = new Date(year, month, 0);
    for (let i = firstDayWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay.getDate() - i;
        const date = new Date(year, month - 1, day);
        addCalendarDay(date, true);
    }
    
    // 添加當月的日期
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        addCalendarDay(date, false);
    }
    
    // 添加下個月的日期
    const remainingDays = 42 - (firstDayWeek + lastDay.getDate());
    for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(year, month + 1, day);
        addCalendarDay(date, true);
    }
}

// 添加日曆日期
function addCalendarDay(date, isOtherMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = date.getDate();
    
    const dateString = formatDate(date);
    const today = new Date();
    const todayString = formatDate(today);
    
    // 檢查是否有任務
    const hasTasks = tasks.some(task => {
        const taskDate = task.scheduledDate || formatDate(new Date(task.createdAt));
        return taskDate === dateString;
    });
    
    // 添加樣式類
    if (isOtherMonth) {
        dayElement.classList.add('other-month');
    }
    
    if (dateString === todayString) {
        dayElement.classList.add('today');
    }
    
    if (dateString === formatDate(selectedDate)) {
        dayElement.classList.add('selected');
    }
    
    if (hasTasks) {
        dayElement.classList.add('has-tasks');
    }
    
    // 點擊事件
    dayElement.addEventListener('click', () => {
        selectedDate = date;
        renderCalendar();
        renderTasks();
        updateSelectedDateDisplay();
    });
    
    calendarDays.appendChild(dayElement);
}

// 格式化日期為 YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 更新選中日期顯示
function updateSelectedDateDisplay() {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        weekday: 'long' 
    };
    const selectedDateString = selectedDate.toLocaleDateString('zh-TW', options);
    
    // 更新行程表日期顯示
    if (scheduleDateDisplay) {
        scheduleDateDisplay.textContent = selectedDateString;
    }
    
    // 更新彈出式窗口的日期顯示
    const popupSelectedDateDisplay = document.getElementById('popupSelectedDateDisplay');
    if (popupSelectedDateDisplay) {
        popupSelectedDateDisplay.textContent = formatDate(selectedDate);
    }
}



// 彈出式窗口表單提交處理
document.getElementById('popupTaskForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // 檢查是否正在編輯常用任務
    if (window.editingTaskId) {
        savePopupQuickTaskEdit();
        return;
    }
    
    const alarmEnabled = document.getElementById('popupAlarmToggle').checked;
    const startTime = document.getElementById('popupStartTime').value;
    const endTime = document.getElementById('popupEndTime').value;
    const taskContent = document.getElementById('popupTaskContent').value;
    const taskLocation = document.getElementById('popupTaskLocation').value;
    
    // 驗證時間（如果結束時間有填寫）
    if (endTime && startTime >= endTime) {
        alert('結束時間必須晚於開始時間');
        return;
    }
    
    // 創建新任務
    const newTask = {
        id: Date.now(),
        alarmEnabled: alarmEnabled,
        startTime: startTime,
        endTime: endTime,
        taskContent: taskContent,
        taskLocation: taskLocation,
        completed: false,
        createdAt: selectedDate.toISOString(),
        scheduledDate: formatDate(selectedDate)
    };
    
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    renderCalendar(); // 重新渲染日曆以顯示任務標記
    
    // 重置表單並關閉模態框
    document.getElementById('popupTaskForm').reset();
    hideAddTaskSection();
    
    // 添加到最近使用
    addToRecentTasks(newTask);
    
    // 更新進度統計
    updateProgressStats();
    
    // 顯示成功訊息
    showNotification('已排程今日任務', 'success');
});

// 渲染任務列表
function renderTasks() {
    taskList.innerHTML = '';
    
    // 過濾選中日期的任務
    const selectedDateString = formatDate(selectedDate);
    const filteredTasks = tasks.filter(task => {
        const taskDate = task.scheduledDate || formatDate(new Date(task.createdAt));
        return taskDate === selectedDateString;
    });
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<div class="no-tasks">尚未建立任務。新增第一個任務。</div>';
        return;
    }
    
    // 按開始時間排序
    filteredTasks.sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    filteredTasks.forEach(task => {
        const taskRow = document.createElement('div');
        taskRow.className = 'task-row';
        taskRow.dataset.taskId = task.id;
        
        taskRow.innerHTML = `
            <div class="task-cell task-alarm">
                <div class="toggle-switch">
                    <input type="checkbox" class="toggle-input" id="alarm-${task.id}" ${task.alarmEnabled ? 'checked' : ''} 
                           onchange="toggleAlarm(${task.id}, this.checked)">
                    <label class="toggle-label" for="alarm-${task.id}"></label>
                </div>
            </div>
            <div class="task-cell task-time">
                ${task.startTime}${task.endTime ? ` - ${task.endTime}` : ''}
            </div>
            <div class="task-cell task-content">
                ${task.taskContent}
                ${task.committed ? '<br><small style="color: #28a745;">✓ 已描述執行方式</small>' : ''}
            </div>
            <div class="task-cell task-location">
                ${task.taskLocation}
            </div>
            <div class="task-cell task-actions">
                <button class="delete-btn" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        taskList.appendChild(taskRow);
    });
}

// 渲染常用任務（現在只在彈出式窗口中使用）
function renderQuickTasks() {
    // 這個函數現在只在彈出式窗口中使用，所以不需要渲染到已刪除的區域
    return;
}

// 選擇常用任務（現在只在彈出式窗口中使用）
function selectQuickTask(taskId) {
    const task = allQuickTasks.find(t => t.id === taskId);
    if (!task) return;

    // 顯示提示
    showNotification(`已載入 ${task.title}`, 'info');
}

// 切換常用任務編輯模式（現在只在彈出式窗口中使用）
function toggleQuickTasksEdit() {
    const editBtn = document.querySelector('.edit-quick-tasks-btn');
    const isEditing = editBtn.classList.contains('editing');
    
    if (isEditing) {
        // 退出編輯模式
        editBtn.classList.remove('editing');
        editBtn.innerHTML = '<i class="fas fa-edit"></i> 編輯';
        renderPopupQuickTasks(); // 重新渲染正常模式
    } else {
        // 進入編輯模式
        editBtn.classList.add('editing');
        editBtn.innerHTML = '<i class="fas fa-check"></i> 完成';
        renderPopupQuickTasks(); // 渲染編輯模式
    }
}

// 渲染常用任務編輯模式（現在只在彈出式窗口中使用）
function renderQuickTasksEdit() {
    // 這個函數現在只在彈出式窗口中使用，所以不需要渲染到已刪除的區域
    return;
}

// 編輯常用任務（現在只在彈出式窗口中使用）
function editQuickTask(taskId) {
    const task = allQuickTasks.find(t => t.id === taskId);
    if (!task) return;

    // 提示用戶可以修改並保存編輯
    showNotification('已載入任務。可修改後保存。', 'info');
}

// 刪除常用任務（現在只在彈出式窗口中使用）
function deleteQuickTask(taskId) {
    if (confirm('確定要移除這個常用任務？')) {
        const index = allQuickTasks.findIndex(t => t.id === taskId);
        if (index > -1) {
            allQuickTasks.splice(index, 1);
            saveQuickTasks();
            showNotification('已移除常用任務', 'info');
        }
    }
}

// 新增常用任務
function addNewQuickTask() {
    // 打開常用任務編輯模態框
    openQuickTaskEditModal();
}

// 保存常用任務到localStorage
function saveQuickTasks() {
    // 只保存用戶自定義的常用任務（排除預設的常用任務）
    const customTasks = allQuickTasks.filter(task => task.id.startsWith('custom_'));
    localStorage.setItem('userQuickTasks', JSON.stringify(customTasks));
}

// 顯示保存編輯按鈕（現在只在彈出式窗口中使用）
function showSaveEditButton() {
    // 這個函數現在只在彈出式窗口中使用
    return;
}

// 保存常用任務編輯（現在只在彈出式窗口中使用）
function saveQuickTaskEdit() {
    // 這個函數現在只在彈出式窗口中使用
    showNotification('請在彈出式窗口中編輯常用任務', 'info');
}

// 保存彈出式窗口中的常用任務編輯
function savePopupQuickTaskEdit() {
    if (!window.editingTaskId) {
        showNotification('沒有正在編輯的任務', 'error');
        return;
    }

    const taskContent = document.getElementById('popupTaskContent').value.trim();
    const taskLocation = document.getElementById('popupTaskLocation').value.trim();
    const startTime = document.getElementById('popupStartTime').value;
    const endTime = document.getElementById('popupEndTime').value;

    if (!taskContent || !taskLocation || !startTime) {
        alert('請填寫任務目標、地點和開始時間');
        return;
    }

    // 找到正在編輯的任務
    const taskIndex = allQuickTasks.findIndex(t => t.id === window.editingTaskId);
    if (taskIndex === -1) {
        showNotification('找不到要編輯的任務', 'error');
        return;
    }

    // 更新任務內容
    allQuickTasks[taskIndex].title = taskContent;
    allQuickTasks[taskIndex].content = taskContent;
    allQuickTasks[taskIndex].location = taskLocation;
    allQuickTasks[taskIndex].defaultTime = endTime ? `${startTime}-${endTime}` : startTime;

    // 如果是預設任務，轉換為自定義任務
    if (!allQuickTasks[taskIndex].id.startsWith('custom_')) {
        allQuickTasks[taskIndex].id = 'custom_' + Date.now();
        allQuickTasks[taskIndex].icon = 'fas fa-star';
    }

    // 保存並重新渲染
    saveQuickTasks();
    renderPopupQuickTasks();
    
    // 隱藏保存編輯按鈕，顯示原有新增任務按鈕
    hidePopupSaveEditButton();
    
    // 清除編輯狀態
    window.editingTaskId = null;
    
    showNotification('已更新常用任務', 'success');
}

// 隱藏保存編輯按鈕（現在只在彈出式窗口中使用）
function hideSaveEditButton() {
    // 這個函數現在只在彈出式窗口中使用
    return;
}

// 顯示彈出式窗口的保存編輯按鈕
function showPopupSaveEditButton() {
    // 隱藏原有的新增任務按鈕
    const addBtn = document.querySelector('#popupTaskForm .add-btn');
    if (addBtn) {
        addBtn.style.display = 'none';
    }

    // 顯示保存編輯按鈕
    let saveEditBtn = document.querySelector('#popupTaskForm .save-edit-btn');
    if (!saveEditBtn) {
        saveEditBtn = document.createElement('button');
        saveEditBtn.type = 'button';
        saveEditBtn.className = 'save-edit-btn';
        saveEditBtn.onclick = savePopupQuickTaskEdit;
        saveEditBtn.innerHTML = '<i class="fas fa-save"></i> 保存編輯';
        
        // 插入到新增任務按鈕的位置
        const formActions = document.querySelector('#popupTaskForm .form-actions');
        if (formActions && addBtn) {
            formActions.insertBefore(saveEditBtn, addBtn.nextSibling);
        }
    }
    saveEditBtn.style.display = 'inline-flex';
}

// 隱藏彈出式窗口的保存編輯按鈕
function hidePopupSaveEditButton() {
    const saveEditBtn = document.querySelector('#popupTaskForm .save-edit-btn');
    if (saveEditBtn) {
        saveEditBtn.style.display = 'none';
    }

    const addBtn = document.querySelector('#popupTaskForm .add-btn');
    if (addBtn) {
        addBtn.style.display = 'inline-flex';
    }
}

// 打開常用任務編輯模態框
function openQuickTaskEditModal() {
    const modal = document.getElementById('quickTaskEditModal');
    const form = document.getElementById('quickTaskEditForm');
    
    // 清空表單
    form.reset();
    
    // 顯示模態框
    modal.style.display = 'block';
    
    // 聚焦到第一個輸入框
    document.getElementById('quickTaskTitle').focus();
}

// 關閉常用任務編輯模態框
function closeQuickTaskEditModal() {
    const modal = document.getElementById('quickTaskEditModal');
    modal.style.display = 'none';
}

// 保存常用任務
function saveQuickTaskFromModal() {
    const title = document.getElementById('quickTaskTitle').value.trim();
    const startTime = document.getElementById('quickTaskStartTime').value;
    const endTime = document.getElementById('quickTaskEndTime').value;
    const location = document.getElementById('quickTaskLocation').value.trim();

    if (!title || !startTime || !location) {
        alert('請填寫任務標題、預設開始時間和執行地點');
        return;
    }

    const newQuickTask = {
        id: 'custom_' + Date.now(),
        title: title,
        content: title,
        location: location,
        icon: 'fas fa-star',
        defaultTime: endTime ? `${startTime}-${endTime}` : startTime
    };

    allQuickTasks.push(newQuickTask);
    saveQuickTasks();
    
    // 重新渲染常用任務（如果當前在編輯模式）
    const editBtn = document.querySelector('.edit-quick-tasks-btn');
    if (editBtn && editBtn.classList.contains('editing')) {

    } else {

    }
    
    closeQuickTaskEditModal();
    showNotification('已新增常用任務', 'success');
}


// 切換鬧鐘狀態
function toggleAlarm(taskId, enabled) {
    console.log('切換鬧鐘狀態:', taskId, enabled); // 調試信息
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.alarmEnabled = enabled;
        saveTasks();
        showNotification(`鬧鐘${enabled ? '已啟用' : '已停用'}`, 'info');
        console.log('鬧鐘狀態已更新:', task.alarmEnabled); // 調試信息
    } else {
        console.error('找不到任務:', taskId); // 調試信息
    }
}

// 刪除任務
function deleteTask(taskId) {
    if (confirm('確定要移除這個任務？')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
        renderCalendar(); // 重新渲染日曆以更新任務標記
        showNotification('已移除任務', 'info');
    }
}

// 保存任務到本地存儲
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// 開始時間檢查
function startTimeCheck() {
    checkInterval = setInterval(checkTasks, 1000); // 每秒檢查一次
}

// 檢查任務時間
function checkTasks() {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM 格式
    const todayString = formatDate(now);
    
    tasks.forEach(task => {
        const taskDate = task.scheduledDate || formatDate(new Date(task.createdAt));
        if (task.alarmEnabled && !task.committed && task.startTime === currentTime && taskDate === todayString) {
            showReminder(task);
        }
    });
}

// 顯示提醒
function showReminder(task) {
    currentReminder = task;
    
    // 立即播放鬧鐘聲音（在顯示模態框之前）
    playAlarm();
    
    // 更新模態框內容
    document.getElementById('currentTime').textContent = new Date().toLocaleTimeString('zh-TW');
    document.getElementById('reminderTask').textContent = task.taskContent;
    document.getElementById('reminderLocation').textContent = task.taskLocation;
    
    // 顯示模態框
    reminderModal.style.display = 'block';
    
    // 確保textarea可以正常輸入
    const textarea = document.getElementById('confirmExecution');
    textarea.disabled = false;
    textarea.readOnly = false;
    textarea.style.pointerEvents = 'auto';
    
    // 延遲一下再設置焦點，確保模態框完全顯示
    setTimeout(() => {
        textarea.focus();
    }, 100);
    
    // 添加鬧鐘動畫
    const modalHeader = document.querySelector('.modal-header h2');
    modalHeader.classList.add('bell-ringing');
}

// 播放鬧鐘聲音
function playAlarm() {
    try {
        // 優先嘗試播放自定義鈴聲
        playCustomAlarm();
        
        // 如果自定義鈴聲失敗，使用Web Audio API作為備用
        setTimeout(() => {
            if (!alarmSound.playing) {
                playWebAudioAlarm();
            }
        }, 200);
        
    } catch (e) {
        console.error('播放鈴聲時發生錯誤:', e);
        // 如果都失敗，使用Web Audio API
        playWebAudioAlarm();
    }
}

// 播放自定義鈴聲
function playCustomAlarm() {
    try {
        alarmSound.volume = 0.7;
        alarmSound.currentTime = 0;
        alarmSound.playing = true;
        
        const playPromise = alarmSound.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('自定義鈴聲開始播放');
                alarmSound.playing = true;
                
                // 如果音頻播放結束，重新開始（循環播放）
                alarmSound.onended = function() {
                    if (alarmSound.playing) {
                        alarmSound.currentTime = 0;
                        alarmSound.play().catch(e => {
                            console.log('自定義鈴聲重複播放失敗:', e);
                        });
                    }
                };
            }).catch(e => {
                console.log('自定義鈴聲播放失敗:', e);
                alarmSound.playing = false;
            });
        }
    } catch (e) {
        console.log('自定義鈴聲播放失敗:', e);
        alarmSound.playing = false;
    }
}

// 使用Web Audio API生成悅耳鈴聲
function playWebAudioAlarm() {
    try {
        // 創建音頻上下文
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // 如果音頻上下文被暫停，需要恢復
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // 創建多個振盪器來產生更豐富的音色
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // 設置音頻參數 - 創建悅耳的鈴聲
        oscillator1.type = 'sine';
        oscillator2.type = 'triangle';
        
        // 主頻率變化（悅耳的旋律）
        const frequencies = [523, 659, 784, 659, 523, 440, 523]; // C5, E5, G5, E5, C5, A4, C5
        const duration = 0.15; // 每個音符的持續時間
        
        frequencies.forEach((freq, index) => {
            const startTime = audioContext.currentTime + (index * duration);
            oscillator1.frequency.setValueAtTime(freq, startTime);
            oscillator2.frequency.setValueAtTime(freq * 1.5, startTime); // 和聲
        });
        
        // 設置音量包絡
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);
        
        // 連接音頻節點
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // 開始播放
        oscillator1.start();
        oscillator2.start();
        
        // 停止播放
        oscillator1.stop(audioContext.currentTime + 1.0);
        oscillator2.stop(audioContext.currentTime + 1.0);
        
        // 設置重複播放（只在沒有其他定時器時創建）
        if (!window.alarmInterval) {
            window.alarmInterval = setInterval(() => {
                if (currentReminder && reminderModal.style.display === 'block') {
                    // 重複播放相同的悅耳鈴聲
                    const newOsc1 = audioContext.createOscillator();
                    const newOsc2 = audioContext.createOscillator();
                    const newGain = audioContext.createGain();
                    
                    newOsc1.type = 'sine';
                    newOsc2.type = 'triangle';
                    
                    frequencies.forEach((freq, index) => {
                        const startTime = audioContext.currentTime + (index * duration);
                        newOsc1.frequency.setValueAtTime(freq, startTime);
                        newOsc2.frequency.setValueAtTime(freq * 1.5, startTime);
                    });
                    
                    newGain.gain.setValueAtTime(0, audioContext.currentTime);
                    newGain.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.05);
                    newGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);
                    
                    newOsc1.connect(newGain);
                    newOsc2.connect(newGain);
                    newGain.connect(audioContext.destination);
                    
                    newOsc1.start();
                    newOsc2.start();
                    newOsc1.stop(audioContext.currentTime + 1.0);
                    newOsc2.stop(audioContext.currentTime + 1.0);
                } else {
                    // 如果模態框已關閉，清除定時器
                    clearInterval(window.alarmInterval);
                    window.alarmInterval = null;
                }
            }, 1200); // 每1.2秒重複一次（給鈴聲完整的播放時間）
        }
        
        console.log('悅耳鈴聲開始播放');
    } catch (e) {
        console.error('Web Audio API播放失敗:', e);
    }
}

// 停止鬧鐘聲音
function stopAlarm() {
    try {
        // 停止自定義鈴聲
        alarmSound.pause();
        alarmSound.currentTime = 0;
        alarmSound.playing = false;
        alarmSound.onended = null; // 清除重複播放事件
        
        // 清除重複播放的定時器
        if (window.alarmInterval) {
            clearInterval(window.alarmInterval);
            window.alarmInterval = null;
        }
        
        // 重置測試按鈕狀態
        const testBtn = document.getElementById('testAlarmBtn');
        if (testBtn) {
            testBtn.textContent = '🔔 測試';
            testBtn.style.background = 'var(--accent-primary)';
        }
        
        console.log('所有鈴聲已停止');
    } catch (e) {
        console.error('停止鈴聲時發生錯誤:', e);
    }
}

// 關閉模態框
function closeReminderModal() {
    reminderModal.style.display = 'none';
    stopAlarm();
    
    // 移除鬧鐘動畫
    const modalHeader = document.querySelector('.modal-header h2');
    modalHeader.classList.remove('bell-ringing');
    
    currentReminder = null;
}

// 確認任務承諾
function confirmTaskCompletion() {
    const confirmExecution = document.getElementById('confirmExecution').value.trim();
    
    if (!confirmExecution) {
        alert('請填寫執行描述');
        return;
    }
    
    // 檢查描述的完整性（至少包含其中兩項）
    const hasTaskContent = currentReminder && confirmExecution.toLowerCase().includes(currentReminder.taskContent.toLowerCase());
    const hasTime = /\d{1,2}[:：]\d{2}/.test(confirmExecution) || /\d{1,2}點/.test(confirmExecution) || /\d{1,2}時/.test(confirmExecution) || /\d{1,2}[:：]\d{2}分/.test(confirmExecution) || /\d{4}-\d{4}/.test(confirmExecution);
    const hasLocation = currentReminder && confirmExecution.toLowerCase().includes(currentReminder.taskLocation.toLowerCase());
    
    const validCount = [hasTaskContent, hasTime, hasLocation].filter(Boolean).length;
    
    if (validCount < 2) {
        alert('描述需包含任務目標、執行時間、執行地點中的至少兩項');
        return;
    }
    
    if (currentReminder) {
        // 更新任務狀態
        currentReminder.committed = true;
        currentReminder.executionPromise = confirmExecution;
        currentReminder.committedAt = new Date().toISOString();
        
        saveTasks();
        renderTasks();
        
        closeReminderModal();
        showNotification('已確認執行計劃', 'success');
    }
}

// 事件監聽器
closeModal.addEventListener('click', closeReminderModal);
confirmTaskBtn.addEventListener('click', confirmTaskCompletion);

// 新增按鈕事件監聽器
const startTaskBtn = document.getElementById('startTask');
const delayTaskBtn = document.getElementById('delayTask');

if (startTaskBtn) {
    startTaskBtn.addEventListener('click', startTaskNow);
}
if (delayTaskBtn) {
    delayTaskBtn.addEventListener('click', delayTask);
}

// 常用任務編輯模態框事件監聽器
const closeQuickTaskEditModalBtn = document.getElementById('closeQuickTaskEditModal');
const cancelQuickTaskEditBtn = document.getElementById('cancelQuickTaskEdit');
const quickTaskEditForm = document.getElementById('quickTaskEditForm');

// 最近使用任務模態框事件監聽器
const closeRecentTasksModalBtn = document.getElementById('closeRecentTasksModal');

if (closeQuickTaskEditModalBtn) {
    closeQuickTaskEditModalBtn.addEventListener('click', closeQuickTaskEditModal);
}

if (cancelQuickTaskEditBtn) {
    cancelQuickTaskEditBtn.addEventListener('click', closeQuickTaskEditModal);
}

if (quickTaskEditForm) {
    quickTaskEditForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveQuickTaskFromModal();
    });
}

if (closeRecentTasksModalBtn) {
    closeRecentTasksModalBtn.addEventListener('click', closeRecentTasksModal);
}

// 點擊模態框外部關閉
window.addEventListener('click', function(e) {
    if (e.target === reminderModal) {
        closeReminderModal();
    }
    if (e.target === document.getElementById('popupTaskModal')) {
        hideAddTaskSection();
    }
    if (e.target === document.getElementById('quickTaskEditModal')) {
        closeQuickTaskEditModal();
    }
    if (e.target === document.getElementById('recentTasksModal')) {
        closeRecentTasksModal();
    }
});

// 顯示通知
function showNotification(message, type = 'info') {
    // 創建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // 添加樣式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#17a2b8'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        animation: slideInRight 0.3s ease;
    `;
    
    // 添加到頁面
    document.body.appendChild(notification);
    
    // 3秒後自動移除
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 添加通知動畫樣式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .no-tasks {
        text-align: center;
        padding: 40px;
        color: #666;
        font-style: italic;
        background: #f8f9fa;
        border-radius: 8px;
        border: 2px dashed #dee2e6;
    }
`;
document.head.appendChild(style);

// 頁面卸載時清理
window.addEventListener('beforeunload', function() {
    if (checkInterval) {
        clearInterval(checkInterval);
    }
});

// 請求通知權限（如果支援）
if ('Notification' in window) {
    Notification.requestPermission();
}

// 顯示瀏覽器通知（如果支援）
function showBrowserNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: '/favicon.ico',
            badge: '/favicon.ico'
        });
    }
}

// 新增功能：進度統計
function updateProgressStats() {
    const today = formatDate(new Date());
    const todayTasks = tasks.filter(task => {
        const taskDate = task.scheduledDate || formatDate(new Date(task.createdAt));
        return taskDate === today;
    });
    
    // 今日完成數
    const completedToday = todayTasks.filter(task => task.committed).length;
    document.getElementById('todayCompleted').textContent = completedToday;
    
    // 連續天數
    const streak = calculateStreak();
    document.getElementById('streakDays').textContent = streak;
    
    // 當日焦點（今日任務總數）
    document.getElementById('todayFocus').textContent = todayTasks.length;
}

// 計算連續天數
function calculateStreak() {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateString = formatDate(checkDate);
        
        const dayTasks = tasks.filter(task => {
            const taskDate = task.scheduledDate || formatDate(new Date(task.createdAt));
            return taskDate === dateString;
        });
        
        if (dayTasks.length > 0 && dayTasks.some(task => task.committed)) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}



// 新增功能：最近使用任務
function toggleRecentTasks() {
    const modal = document.getElementById('recentTasksModal');
    if (modal.style.display === 'block') {
        closeRecentTasksModal();
    } else {
        openRecentTasksModal();
    }
}

function openRecentTasksModal() {
    const modal = document.getElementById('recentTasksModal');
    renderRecentTasks();
    modal.style.display = 'block';
}

function closeRecentTasksModal() {
    const modal = document.getElementById('recentTasksModal');
    modal.style.display = 'none';
}

function renderRecentTasks() {
    const recentTasksList = document.getElementById('recentTasksList');
    if (!recentTasksList) return;
    
    recentTasksList.innerHTML = '';
    
    if (recentTasks.length === 0) {
        recentTasksList.innerHTML = '<div class="no-tasks">尚未有最近使用的任務</div>';
        return;
    }
    
    recentTasks.forEach((task, index) => {
        const taskItem = document.createElement('div');
        taskItem.className = 'recent-task-item';
        taskItem.onclick = () => loadRecentTask(task);
        
        taskItem.innerHTML = `
            <div class="recent-task-info">
                <div class="recent-task-title">${task.title}</div>
                <div class="recent-task-details">${task.time} • ${task.location}</div>
            </div>
            <div class="recent-task-actions">
                <button onclick="event.stopPropagation(); loadRecentTask(${JSON.stringify(task)})" title="載入">
                    <i class="fas fa-arrow-up"></i>
                </button>
                <button onclick="event.stopPropagation(); removeRecentTask(${index})" title="移除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        recentTasksList.appendChild(taskItem);
    });
}

function loadRecentTask(task) {
    document.getElementById('taskContent').value = task.title;
    document.getElementById('taskLocation').value = task.location;
    document.getElementById('startTime').value = task.time;
    document.getElementById('alarmToggle').checked = true;
    
    closeRecentTasksModal();
    showNotification(`已載入 ${task.title}`, 'info');
}

function removeRecentTask(index) {
    recentTasks.splice(index, 1);
    saveRecentTasks();
    renderRecentTasks();
    showNotification('已移除最近使用項目', 'info');
}

function addToRecentTasks(task) {
    const recentTask = {
        title: task.taskContent,
        location: task.taskLocation,
        time: task.startTime,
        timestamp: Date.now()
    };
    
    // 移除重複項目
    const existingIndex = recentTasks.findIndex(t => 
        t.title === recentTask.title && t.location === recentTask.location
    );
    
    if (existingIndex > -1) {
        recentTasks.splice(existingIndex, 1);
    }
    
    // 添加到開頭
    recentTasks.unshift(recentTask);
    
    // 只保留最近10個
    if (recentTasks.length > 10) {
        recentTasks.splice(10);
    }
    
    saveRecentTasks();
}

function saveRecentTasks() {
    localStorage.setItem('recentTasks', JSON.stringify(recentTasks));
}

// 新增功能：任務操作（開始、延後）
function startTaskNow() {
    if (!currentReminder) return;
    
    // 標記任務為已開始
    currentReminder.started = true;
    currentReminder.startedAt = new Date().toISOString();
    
    saveTasks();
    closeReminderModal();
    showNotification('任務已開始', 'success');
    
    // 更新進度統計
    updateProgressStats();
}

function delayTask() {
    if (!currentReminder) return;
    
    // 延後10分鐘
    const currentTime = new Date();
    currentTime.setMinutes(currentTime.getMinutes() + 10);
    const newTime = currentTime.toTimeString().slice(0, 5);
    
    currentReminder.startTime = newTime;
    currentReminder.delayed = true;
    currentReminder.delayedAt = new Date().toISOString();
    
    saveTasks();
    closeReminderModal();
    showNotification(`已延後至 ${newTime}`, 'info');
    
    // 重新渲染任務列表
    renderTasks();
}

// 新增功能：批次通知系統
function showNotification(message, type = 'info') {
    notificationQueue.push({ message, type });
    
    if (!isNotificationShowing) {
        processNotificationQueue();
    }
}

function processNotificationQueue() {
    if (notificationQueue.length === 0) {
        isNotificationShowing = false;
        return;
    }
    
    isNotificationShowing = true;
    const notification = notificationQueue.shift();
    
    // 創建通知元素
    const notificationEl = document.createElement('div');
    notificationEl.className = `notification notification-${notification.type}`;
    notificationEl.innerHTML = `
        <i class="fas fa-${notification.type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${notification.message}</span>
    `;
    
    // 添加樣式
    notificationEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-light);
        color: var(--text-primary);
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        animation: slideInRight 0.3s ease;
    `;
    
    // 添加到頁面
    document.body.appendChild(notificationEl);
    
    // 3秒後自動移除
    setTimeout(() => {
        notificationEl.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notificationEl.parentNode) {
                notificationEl.parentNode.removeChild(notificationEl);
            }
            // 處理下一個通知
            setTimeout(processNotificationQueue, 100);
        }, 300);
    }, 3000);
}

// 彈出式新增任務模態框事件監聽器
const closePopupTaskModalBtn = document.getElementById('closePopupTaskModal');

if (closePopupTaskModalBtn) {
    closePopupTaskModalBtn.addEventListener('click', hideAddTaskSection);
}

// 新增功能：快捷鍵支援
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + N：新增任務
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        showAddTaskSection();
    }
    
    // Escape：關閉模態框
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        });
    }
});

// 新增功能：顯示/隱藏新增任務模態框（現在使用彈出式窗口）
function showAddTaskSection() {
    const popupTaskModal = document.getElementById('popupTaskModal');
    const popupSelectedDateDisplay = document.getElementById('popupSelectedDateDisplay');
    
    // 更新模態框中的日期顯示
    popupSelectedDateDisplay.textContent = formatDate(selectedDate);
    
    // 渲染模態框中的常用任務
    renderPopupQuickTasks();
    
    // 顯示模態框
    popupTaskModal.style.display = 'block';
    
    // 聚焦到第一個輸入框
    setTimeout(() => {
        document.getElementById('popupTaskContent').focus();
    }, 300);
}

function hideAddTaskSection() {
    const popupTaskModal = document.getElementById('popupTaskModal');
    popupTaskModal.style.display = 'none';
    
    // 重置表單
    document.getElementById('popupTaskForm').reset();
    
    // 清除編輯狀態
    window.editingTaskId = null;
    hidePopupSaveEditButton();
    
    // 退出編輯模式
    const editBtn = document.querySelector('.edit-quick-tasks-btn');
    if (editBtn && editBtn.classList.contains('editing')) {
        editBtn.classList.remove('editing');
        editBtn.innerHTML = '<i class="fas fa-edit"></i> 編輯';
    }
}

function hideAddTaskModal() {
    hideAddTaskSection();
}

// 便捷時間設置功能
function setQuickTime() {
    const now = new Date();
    const startTime = now.toTimeString().slice(0, 5); // 獲取當前時間 HH:MM
    
    // 計算25分鐘後的時間
    const endTime = new Date(now.getTime() + 25 * 60 * 1000);
    const endTimeString = endTime.toTimeString().slice(0, 5);
    
    // 設置表單中的時間
    document.getElementById('popupStartTime').value = startTime;
    document.getElementById('popupEndTime').value = endTimeString;
    
    // 自動開啟鬧鐘
    document.getElementById('popupAlarmToggle').checked = true;
    
    // 顯示成功提示
    showNotification(`已設置 ${startTime} - ${endTimeString} 的25分鐘任務`, 'success');
}

// 新增功能：渲染彈出式模態框中的常用任務
function renderPopupQuickTasks() {
    const popupQuickTasksGrid = document.getElementById('popupQuickTasksGrid');
    if (!popupQuickTasksGrid) return;
    
    popupQuickTasksGrid.innerHTML = '';
    
    // 檢查是否處於編輯模式
    const editBtn = document.querySelector('.edit-quick-tasks-btn');
    const isEditing = editBtn && editBtn.classList.contains('editing');
    
    if (isEditing) {
        // 編輯模式：顯示編輯界面
        allQuickTasks.forEach(task => {
            const taskBtn = document.createElement('div');
            taskBtn.className = 'quick-task-btn edit-mode';
            taskBtn.dataset.taskId = task.id;

            taskBtn.innerHTML = `
                <div class="edit-task-content">
                    <span class="task-title">${task.title}</span>
                    <span class="task-time">${task.defaultTime}</span>
                </div>
                <div class="edit-task-actions">
                    <button class="edit-task-btn" onclick="editPopupQuickTask('${task.id}')" title="編輯">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-task-btn" onclick="deletePopupQuickTask('${task.id}')" title="刪除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            popupQuickTasksGrid.appendChild(taskBtn);
        });
    } else {
        // 正常模式：顯示選擇界面
        allQuickTasks.forEach(task => {
            const btn = document.createElement('button');
            btn.className = 'quick-task-btn';
            btn.onclick = () => selectPopupQuickTask(task);
            
            btn.innerHTML = `
                <div class="task-title">${task.title}</div>
                <div class="task-time">${task.defaultTime}</div>
                <i class="fas fa-star task-icon"></i>
            `;
            
            popupQuickTasksGrid.appendChild(btn);
        });
    }
    
    // 新增「新增常用任務」按鈕
    const addNewBtn = document.createElement('button');
    addNewBtn.className = 'quick-task-btn add-new-task';
    addNewBtn.onclick = () => {
        hideAddTaskSection();
        openQuickTaskEditModal();
    };
    
    addNewBtn.innerHTML = `
        <i class="fas fa-plus"></i>
        <span>新增常用任務</span>
    `;
    
    popupQuickTasksGrid.appendChild(addNewBtn);
}



// 選擇彈出式模態框中的常用任務
function selectPopupQuickTask(task) {
    document.getElementById('popupTaskContent').value = task.title;
    document.getElementById('popupTaskLocation').value = task.location;
    
    // 解析時間格式
    if (task.defaultTime.includes('-')) {
        const [startTime, endTime] = task.defaultTime.split('-');
        document.getElementById('popupStartTime').value = startTime;
        document.getElementById('popupEndTime').value = endTime;
    } else {
        document.getElementById('popupStartTime').value = task.defaultTime;
        document.getElementById('popupEndTime').value = '';
    }
    
    document.getElementById('popupAlarmToggle').checked = true;
    
    showNotification(`已載入 ${task.title}`, 'info');
}

// PWA Service Worker 註冊
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // 簡化的Service Worker註冊
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('SW registered successfully: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// 勵志文字相關函數
async function loadInspirationQuotes() {
    console.log('開始載入勵志文字...');
    
    // 先使用內嵌的勵志文字確保功能正常
    const embeddedQuotes = [
        { id: 1, text: "有成就的人，不要忘記一件事，就是要有勇氣和決心戰勝自己。" },
        { id: 2, text: "行動是治癒恐懼的良藥，而猶豫、拖延將不斷滋養恐懼。" },
        { id: 3, text: "有所成就是人生唯一的真正樂趣。" },
        { id: 4, text: "一天進步1%。" },
        { id: 5, text: "不是很厲害才能開始，是開始了才會很厲害。" },
        { id: 6, text: "行動是成功的關鍵，思考只是開始。" },
        { id: 7, text: "不要等待，時間永遠不會剛剛好。" },
        { id: 8, text: "專注於當下，完成每一件小事。" },
        { id: 9, text: "每天進步一點點，累積起來就是巨大飛躍。" },
        { id: 10, text: "你的時間有限，不要浪費在重複的生活上。" }
    ];
    
    try {
        console.log('嘗試載入 inspiration-quotes.json...');
        const response = await fetch('inspiration-quotes.json');
        console.log('回應狀態:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('JSON 解析成功:', data);
        
        inspirationQuotes = data.quotes;
        console.log('勵志文字載入成功，共', inspirationQuotes.length, '條');
    } catch (error) {
        console.error('載入勵志文字失敗:', error);
        console.log('使用內嵌勵志文字...');
        
        // 使用內嵌文字
        inspirationQuotes = embeddedQuotes;
        console.log('使用內嵌勵志文字，共', inspirationQuotes.length, '條');
    }
    
    // 開始輪換文字
    startQuoteRotation();
}

function startQuoteRotation() {
    console.log('startQuoteRotation 被調用');
    console.log('inspirationQuotes 長度:', inspirationQuotes.length);
    console.log('inspirationQuotes 內容:', inspirationQuotes);
    
    if (inspirationQuotes.length === 0) {
        console.error('勵志文字數組為空，無法開始輪換');
        return;
    }
    
    console.log('開始勵志文字輪換，總共', inspirationQuotes.length, '條文字');
    
    // 清除現有的定時器
    if (quoteChangeInterval) {
        clearInterval(quoteChangeInterval);
        console.log('清除舊的定時器');
    }
    
    // 設置輪換間隔（10秒）
    quoteChangeInterval = setInterval(() => {
        console.log('定時器觸發，準備切換文字');
        changeQuote();
    }, 10000);
    
    console.log('定時器設置完成，間隔 10 秒');
    
    // 立即顯示隨機第一條文字
    const randomIndex = Math.floor(Math.random() * inspirationQuotes.length);
    currentQuoteIndex = randomIndex;
    console.log('選擇隨機索引:', randomIndex);
    displayQuote(inspirationQuotes[randomIndex]);
}

function changeQuote() {
    if (inspirationQuotes.length === 0) {
        console.error('勵志文字數組為空，無法切換');
        return;
    }
    
    // 淡出效果
    const inspirationElement = document.querySelector('.inspiration-text p');
    if (inspirationElement) {
        inspirationElement.style.opacity = '0';
        
        setTimeout(() => {
            // 隨機選擇下一條文字（避免重複）
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * inspirationQuotes.length);
            } while (newIndex === currentQuoteIndex && inspirationQuotes.length > 1);
            
            currentQuoteIndex = newIndex;
            const nextQuote = inspirationQuotes[currentQuoteIndex];
            
            console.log('切換到第', currentQuoteIndex + 1, '條勵志文字');
            
            // 更新文字內容
            displayQuote(nextQuote);
            
            // 淡入效果
            inspirationElement.style.opacity = '1';
        }, 500);
    } else {
        console.error('找不到勵志文字元素');
    }
}

function displayQuote(quote) {
    console.log('displayQuote 被調用，參數:', quote);
    
    const inspirationElement = document.querySelector('.inspiration-text p');
    console.log('找到的元素:', inspirationElement);
    
    if (inspirationElement && quote) {
        console.log('準備設置文字內容:', quote.text);
        inspirationElement.textContent = quote.text;
        console.log('文字設置完成');
    } else {
        console.error('找不到勵志文字元素或引用為空');
        console.error('inspirationElement:', inspirationElement);
        console.error('quote:', quote);
    }
}

// 手動切換勵志文字（可選功能）
function nextQuote() {
    changeQuote();
}

function previousQuote() {
    if (inspirationQuotes.length === 0) return;
    
    const inspirationElement = document.querySelector('.inspiration-text p');
    if (inspirationElement) {
        inspirationElement.style.opacity = '0';
        
        setTimeout(() => {
            currentQuoteIndex = (currentQuoteIndex - 1 + inspirationQuotes.length) % inspirationQuotes.length;
            const prevQuote = inspirationQuotes[currentQuoteIndex];
            displayQuote(prevQuote);
            inspirationElement.style.opacity = '1';
        }, 500);
    }
}

// 編輯彈出式模態框中的常用任務
function editPopupQuickTask(taskId) {
    const task = allQuickTasks.find(t => t.id === taskId);
    if (!task) return;

    // 填充表單
    document.getElementById('popupTaskContent').value = task.title;
    document.getElementById('popupTaskLocation').value = task.location;
    
    // 解析時間格式
    if (task.defaultTime.includes('-')) {
        const [startTime, endTime] = task.defaultTime.split('-');
        document.getElementById('popupStartTime').value = startTime;
        document.getElementById('popupEndTime').value = endTime;
    } else {
        document.getElementById('popupStartTime').value = task.defaultTime;
        document.getElementById('popupEndTime').value = '';
    }
    
    document.getElementById('popupAlarmToggle').checked = true;
    
    // 儲存正在編輯的任務ID
    window.editingTaskId = taskId;
    
    // 顯示保存編輯按鈕
    showPopupSaveEditButton();
    
    showNotification(`已載入 ${task.title} 進行編輯`, 'info');
}

// 刪除彈出式模態框中的常用任務
function deletePopupQuickTask(taskId) {
    if (confirm('確定要移除這個常用任務？')) {
        const index = allQuickTasks.findIndex(t => t.id === taskId);
        if (index > -1) {
            allQuickTasks.splice(index, 1);
            saveQuickTasks();
            renderPopupQuickTasks(); // 重新渲染
            showNotification('已移除常用任務', 'info');
        }
    }
}


