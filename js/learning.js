let courseData = null;
let progressData = null;
let currentLessonIndex = -1;
let flatLessons = []; // To easily navigate prev/next

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course');
    
    if (!courseId) {
        alert('No course specified');
        window.location.href = 'dashboard.html';
        return;
    }

    try {
        // Fetch course details from shared data
        if (typeof sampleCourses !== 'undefined') {
            courseData = sampleCourses.find(c => c.id === Number(courseId));
        }

        if (!courseData) {
            // Fallback to API if not in mock data
            courseData = await ApiService.get(`/courses/${courseId}`);
        }
        
        document.getElementById('course-title-nav').textContent = courseData.title;

        // Fetch user progress (mock or real)
        try {
            progressData = await ApiService.get(`/progress/${courseId}`);
        } catch(e) {
            // Mock progress if API fails
            progressData = {
                course_id: courseId,
                completed_lesson_ids: [],
                progress_percentage: 0
            };
        }
        
        updateProgressUI();

        // Ensure courseData has sections (fallback for sample courses that don't have them)
        if (!courseData.sections) {
            courseData.sections = [
                {
                    order_number: 1,
                    title: "Getting Started",
                    lessons: [
                        { id: 1001, title: "Course Introduction", duration: 15, youtube_url: "https://www.youtube.com/embed/rfscVS0vtbw" },
                        { id: 1002, title: "Setting Up Your Environment", duration: 25, youtube_url: "https://www.youtube.com/embed/rfscVS0vtbw" }
                    ]
                }
            ];
        }

        // Flatten lessons for easier navigation
        courseData.sections.forEach(section => {
            if(section.lessons) {
                section.lessons.forEach(lesson => {
                    flatLessons.push(lesson);
                });
            }
        });

        renderSyllabus();

        // Auto-select first lesson or first uncompleted lesson
        if (flatLessons.length > 0) {
            let startIdx = 0;
            // Find last completed, or first uncompleted
            if (progressData && progressData.completed_lesson_ids.length > 0) {
                const lastCompletedId = progressData.completed_lesson_ids[progressData.completed_lesson_ids.length - 1];
                const idx = flatLessons.findIndex(l => l.id === lastCompletedId);
                if (idx !== -1 && idx < flatLessons.length - 1) {
                    startIdx = idx + 1; // Start next lesson
                }
            }
            loadLesson(startIdx);
        }

    } catch(e) {
        console.error(e);
        showAlert('Failed to load course content. Are you enrolled?', 'danger');
    }
});

function renderSyllabus() {
    const container = document.getElementById('syllabus-container');
    let html = '';

    courseData.sections.forEach(section => {
        html += `<div class="section-header">Section ${section.order_number}: ${section.title}</div>`;
        if(section.lessons) {
            section.lessons.forEach(lesson => {
                const globalIndex = flatLessons.findIndex(l => l.id === lesson.id);
                const isCompleted = progressData.completed_lesson_ids.includes(lesson.id);
                
                html += `
                    <div class="lesson-nav-item ${globalIndex === currentLessonIndex ? 'active' : ''}" 
                         id="nav-lesson-${globalIndex}" 
                         onclick="loadLesson(${globalIndex})">
                        <div class="check-circle ${isCompleted ? 'completed' : ''}">
                            ${isCompleted ? '<svg width="12" height="12" viewBox="0 0 24 24" stroke="white" stroke-width="3" fill="none"><path d="M20 6L9 17l-5-5"/></svg>' : ''}
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; color: var(--text-main);">${lesson.title}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${lesson.duration}m</div>
                        </div>
                    </div>
                `;
            });
        }
    });

    container.innerHTML = html;
}

function loadLesson(index) {
    if (index < 0 || index >= flatLessons.length) return;

    // Remove active class from old
    if (currentLessonIndex !== -1) {
        const oldEl = document.getElementById(`nav-lesson-${currentLessonIndex}`);
        if(oldEl) oldEl.classList.remove('active');
    }

    currentLessonIndex = index;
    const lesson = flatLessons[currentLessonIndex];

    // Play video
    const videoContainer = document.getElementById('video-frame-container');
    
    // Process youtube URL to add autoplay and rel=0
    let embedUrl = lesson.youtube_url;
    if (embedUrl.includes('?')) {
        embedUrl += '&rel=0';
    } else {
        embedUrl += '?rel=0';
    }

    videoContainer.innerHTML = `<iframe src="${embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    
    document.getElementById('lesson-title').textContent = lesson.title;

    // Add active class to new
    const newEl = document.getElementById(`nav-lesson-${currentLessonIndex}`);
    if(newEl) {
        newEl.classList.add('active');
        // Scroll sidebar
        newEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Update buttons
    const isCompleted = progressData.completed_lesson_ids.includes(lesson.id);
    const completeBtn = document.getElementById('complete-btn');
    
    document.getElementById('prev-btn').disabled = currentLessonIndex === 0;
    document.getElementById('next-btn').disabled = currentLessonIndex === flatLessons.length - 1;
    
    completeBtn.style.display = 'inline-flex';
    if (isCompleted) {
        completeBtn.classList.remove('btn-primary');
        completeBtn.classList.add('btn-secondary');
        completeBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" stroke-width="2" style="margin-right: 8px;"><path d="M20 6L9 17l-5-5"/></svg> Completed';
        completeBtn.disabled = true;
    } else {
        completeBtn.classList.add('btn-primary');
        completeBtn.classList.remove('btn-secondary');
        completeBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;"><path d="M20 6L9 17l-5-5"/></svg> Mark as Complete';
        completeBtn.disabled = false;
    }
}

function playLesson(dir) {
    if (dir === 'prev') loadLesson(currentLessonIndex - 1);
    if (dir === 'next') loadLesson(currentLessonIndex + 1);
}

async function markComplete() {
    if (currentLessonIndex === -1) return;
    const lesson = flatLessons[currentLessonIndex];
    
    try {
        await ApiService.post('/lesson/complete', {
            lesson_id: lesson.id,
            completed: true
        });

        // Update local state
        if (!progressData.completed_lesson_ids.includes(lesson.id)) {
            progressData.completed_lesson_ids.push(lesson.id);
        }
        
        // Fetch new progress percentage if real API
        try {
            const updatedProgress = await ApiService.get(`/progress/${courseData.id}`);
            progressData.progress_percentage = updatedProgress.progress_percentage;
        } catch(e) {
            // Mock percentage calculation
            progressData.progress_percentage = Math.round((progressData.completed_lesson_ids.length / flatLessons.length) * 100);
        }
        
        // Re-render
        renderSyllabus();
        updateProgressUI();
        loadLesson(currentLessonIndex); // Refresh button state
        
        showAlert('Lesson marked as complete!', 'success');
        
        // Auto-play next if available
        if (currentLessonIndex < flatLessons.length - 1) {
            setTimeout(() => {
                playLesson('next');
            }, 1000);
        }

    } catch (e) {
        showAlert(e.message || 'Failed to update progress', 'danger');
    }
}

function updateProgressUI() {
    if (!progressData) return;
    document.getElementById('overall-progress').style.width = `${progressData.progress_percentage}%`;
    document.getElementById('progress-text').textContent = `${progressData.progress_percentage}% Complete`;
}
