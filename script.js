document.addEventListener("DOMContentLoaded", () => {
    const examNameElem = document.getElementById("examName");
    const messageElem = document.getElementById("message");
    const currentTimeElem = document.getElementById("current-time");
    const currentSubjectElem = document.getElementById("current-subject");
    const examTimingElem = document.getElementById("exam-timing");
    const remainingTimeElem = document.getElementById("remaining-time");
    const statusElem = document.getElementById("status");
    const examTableBodyElem = document.getElementById("exam-table-body");
    const fullscreenBtn = document.getElementById("fullscreen-btn");
    const settingsBtn = document.getElementById("settings-btn");
    const settingsModal = document.getElementById("settings-modal");
    const closeSettingsBtn = document.getElementById("close-settings-btn");
    const saveSettingsBtn = document.getElementById("save-settings-btn");
    const offsetTimeInput = document.getElementById("offset-time");
    const roomInput = document.getElementById("room-input");
    const roomElem = document.getElementById("room");

    let offsetTime = getCookie("offsetTime") || 0;
    let room = getCookie("room") || "";

    offsetTime = parseInt(offsetTime);
    roomElem.textContent = room;

    function fetchData() {
        return fetch('exam_config.json', { cache: "no-store" }) // 不保留缓存
            .then(response => response.json())
            .then(data => {
                displayExamInfo(data);
                updateCurrentTime();
                updateExamInfo(data);
                setInterval(() => updateCurrentTime(), 1000); // Update current time every second
                setInterval(() => updateExamInfo(data), 1000); // Update exam info every second
            })
            .catch(error => console.error('Error fetching exam data:', error));
    }

    function displayExamInfo(data) {
        // Display exam name
        const prefix = "考试安排";
        const currentText = examNameElem.textContent;
        const newText = `${data.examName}`;
        examNameElem.textContent = currentText.replace(/考试安排.*/, newText);
        // Display message
        messageElem.textContent = data.message;
    }

    function updateCurrentTime() {
        const now = new Date(new Date().getTime() + offsetTime * 1000);
        currentTimeElem.textContent = now.toLocaleTimeString('zh-CN', { hour12: false });
    }

    function formatTimeWithoutSeconds(time) {
        // Convert time to string and remove seconds if present
        return time.slice(0, -3);
    }

    function updateExamInfo(data) {
        const now = new Date(new Date().getTime() + offsetTime * 1000);
        let currentExam = null;
        let nextExam = null;

        data.examInfos.forEach(exam => {
            const start = new Date(new Date(exam.start).getTime() + offsetTime * 1000);
            const end = new Date(new Date(exam.end).getTime() + offsetTime * 1000);
            if (now >= start && now <= end) {
                currentExam = exam;
            }
            if (!currentExam && !nextExam && now < start) {
                nextExam = exam;
            }
        });

        if (currentExam) {
            currentSubjectElem.textContent = `当前科目: ${currentExam.name}`;
            examTimingElem.textContent = `起止时间: ${formatTimeWithoutSeconds(new Date(currentExam.start).toLocaleTimeString('zh-CN', { hour12: false }))} - ${formatTimeWithoutSeconds(new Date(currentExam.end).toLocaleTimeString('zh-CN', { hour12: false }))}`;
            const remainingTime = (new Date(currentExam.end) - now) / 1000;
            const remainingHours = Math.floor(remainingTime / 3600);
            const remainingMinutes = Math.floor((remainingTime % 3600) / 60);
            const remainingSeconds = Math.floor(remainingTime % 60);
            const remainingTimeText = `剩余时间: ${remainingHours}时 ${remainingMinutes}分 ${remainingSeconds}秒`;

            if (remainingHours === 0 && remainingMinutes <= 14) {
                remainingTimeElem.textContent = remainingTimeText;
                remainingTimeElem.style.color = "red";
                remainingTimeElem.style.fontWeight = "bold";
            } else {
                remainingTimeElem.textContent = remainingTimeText;
                remainingTimeElem.style.color = "#93b4f7";
                remainingTimeElem.style.fontWeight = "normal";
            }

            statusElem.textContent = "状态: 进行中";
            statusElem.style.color = "green";
        } else if (nextExam) {
            currentSubjectElem.textContent = `下一场科目: ${nextExam.name}`;
            examTimingElem.textContent = `起止时间: ${formatTimeWithoutSeconds(new Date(nextExam.start).toLocaleTimeString('zh-CN', { hour12: false }))} - ${formatTimeWithoutSeconds(new Date(nextExam.end).toLocaleTimeString('zh-CN', { hour12: false }))}`;
            remainingTimeElem.textContent = "剩余时间: -";
            statusElem.textContent = "状态: 未开始";
            statusElem.style.color = "orange";
        } else {
            currentSubjectElem.textContent = "当前无考试";
            examTimingElem.textContent = "";
            remainingTimeElem.textContent = "";
            statusElem.textContent = "状态: 空闲";
            statusElem.style.color = "blue";
        }

        // Update next exams table
        examTableBodyElem.innerHTML = "";
        data.examInfos.forEach(exam => {
            const start = new Date(new Date(exam.start).getTime() + offsetTime * 1000);
            const end = new Date(new Date(exam.end).getTime() + offsetTime * 1000);
            let status = "";
            if (now < start) {
                status = "即将开始";
            } else if (now > end) {
                status = "已结束";
            } else {
                status = "进行中";
            }

            const row = document.createElement("tr");
            row.className = `exam-status-${status}`;
            row.innerHTML = `
                <td>${exam.name}</td>
                <td>${formatTimeWithoutSeconds(new Date(exam.start).toLocaleTimeString('zh-CN', { hour12: false }))}</td>
                <td>${formatTimeWithoutSeconds(new Date(exam.end).toLocaleTimeString('zh-CN', { hour12: false }))}</td>
            `;
            examTableBodyElem.appendChild(row);
        });
    }

    // Fullscreen functionality
    fullscreenBtn.addEventListener("click", () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    });

    // Open settings modal
    settingsBtn.addEventListener("click", () => {
        offsetTimeInput.value = offsetTime;
        roomInput.value = room;
        settingsModal.style.display = "block";
    });

    // Close settings modal
    closeSettingsBtn.addEventListener("click", () => {
        settingsModal.style.display = "none";
    });

    // Save settings
    saveSettingsBtn.addEventListener("click", () => {
        offsetTime = parseInt(offsetTimeInput.value);
        room = roomInput.value;
        setCookie("offsetTime", offsetTime, 365);
        setCookie("room", room, 365);
        roomElem.textContent = room;
        settingsModal.style.display = "none";
    });

    // Utility function to set a cookie
    function setCookie(name, value, days) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + d.toUTCString();
        document.cookie = name + "=" + value + ";" + expires + ";path=/";
    }

    // Utility function to get a cookie
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    fetchData();
});
