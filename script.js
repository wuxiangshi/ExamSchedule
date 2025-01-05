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

    function fetchData() {
        fetch('exam_config.json')
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
        examNameElem.textContent = data.examName;
        // Display message
        messageElem.textContent = data.message;
    }

    function updateCurrentTime() {
        const now = new Date();
        currentTimeElem.textContent = now.toLocaleTimeString('zh-CN', { hour12: false });
    }

    function formatTimeWithoutSeconds(time) {
        // Convert time to string and remove seconds if present
        return time.slice(0, -3);
    }

    function updateExamInfo(data) {
        const now = new Date();
        let currentExam = null;
        let nextExam = null;

        data.examInfos.forEach(exam => {
            const start = new Date(exam.start);
            const end = new Date(exam.end);
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

            if (remainingHours === 0 && remainingMinutes <= 15) {
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
            statusElem.textContent = "状态: 即将开始";
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
            const start = new Date(exam.start);
            const end = new Date(exam.end);
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

    fetchData();
});
