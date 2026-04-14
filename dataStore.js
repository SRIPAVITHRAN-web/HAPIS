// dataStore.js - Handles Database Synchronization with Python Server

class DataStore {
    static cache = [];
    static API_BASE = "https://resume-poec.onrender.com";

    // Call this ONLY once on boot to pull the authoritative Data from Python
    static async hydrate() {
        try {
            const response = await fetch(`${this.API_BASE}/api/students`);
            if (response.ok) {
                this.cache = await response.json();
                console.log("HAPIS Connected: Database Hydrated from Server.");
            } else {
                console.error("Failed to load server database.");
            }
        } catch (e) {
            console.error("HAPIS Warning: Server offline. Using empty local cache.", e);
            this.cache = [];
        }
    }

    // Synchronous read for the UI components
    static getStudents() {
        return this.cache;
    }

    // Asynchronous write to push local changes up to the server
    static async saveStudents(students) {
        this.cache = students; // Update locally immediately for snappy UI
        
        try {
            await fetch(`${this.API_BASE}/api/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(students)
            });
        } catch (e) {
            console.error("HAPIS Warning: Could not sync to Python backend.", e);
            alert("Warning: Changes are not being saved to backend.");
        }
    }

    static async updateStudentPipeline(rollNo, status) {
        let students = this.getStudents();
        let updated = false;
        students = students.map(s => {
            if (s.rollNo === rollNo) {
                updated = true;
                return { ...s, pipelineStatus: status };
            }
            return s;
        });
        if (updated) {
            await this.saveStudents(students);
        }
    }

    static async deleteStudent(rollNo) {
        let students = this.getStudents();
        const initialLength = students.length;
        students = students.filter(s => s.rollNo !== rollNo);
        
        if (students.length < initialLength) {
            this.cache = students; // Update locally
            try {
                const response = await fetch(`${this.API_BASE}/api/students/${encodeURIComponent(rollNo)}`, {
                    method: 'DELETE'
                });
                if (!response.ok) {
                    console.error("HAPIS Warning: Could not delete from backend.");
                }
            } catch (e) {
                console.error("HAPIS Error: Failed to hit delete endpoint.", e);
            }
        }
    }

    static parseCSV(file, callback) {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rawData = results.data;
                const existingData = this.getStudents();
                
                // Helper to preserve existing pipeline tracking if re-importing the same person
                const existingStatusMap = {};
                existingData.forEach(s => {
                   existingStatusMap[s.rollNo] = s.pipelineStatus || 'none';
                });

                const processed = rawData.map(row => {
                    const skillsStr = row['Skills'] || '';
                    const skills = skillsStr.split(',').map(s => s.trim()).filter(s => s);
                    
                    const cgpa = parseFloat(row['CGPA']) || 0;
                    const projects = parseInt(row['Projects']) || 0;
                    const internships = parseInt(row['Internships']) || 0;
                    const hackathons = parseInt(row['Hackathons']) || 0;

                    // AI System Score
                    let score = (cgpa * 5) + (Math.min(projects, 5) * 4) + (Math.min(internships, 3) * 6) + (Math.min(hackathons, 3) * 4);
                    if (score > 100) score = 100;

                    return {
                        id: Math.random().toString(36).substr(2, 9),
                        rollNo: row['Roll No'],
                        name: row['Name'],
                        branch: row['Branch'],
                        cgpa: cgpa.toFixed(2),
                        skills: skills,
                        internships: internships,
                        projects: projects,
                        hackathons: hackathons,
                        github: row['Github'] || '',
                        linkedin: row['LinkedIn'] || '',
                        score: score.toFixed(1),
                        pipelineStatus: existingStatusMap[row['Roll No']] || 'none'
                    };
                });

                const combinedData = [...existingData, ...processed];
                await DataStore.saveStudents(combinedData);
                if (callback) callback(processed);
            },
            error: (error) => {
                console.error("Error parsing CSV: ", error);
                alert("Failed to parse CSV file. Ensure it has the correct schema.");
            }
        });
    }

    static getStats() {
        const students = this.getStudents();
        const total = students.length;
        
        if (total === 0) return { total: 0, avgCgpa: 0, totalProjects: 0, totalInterns: 0, topSkills: [] };

        let sumCgpa = 0, sumProjects = 0, sumInterns = 0;
        const skillCounts = {};

        students.forEach(s => {
            sumCgpa += parseFloat(s.cgpa) || 0;
            sumProjects += s.projects || 0;
            sumInterns += s.internships || 0;
            
            s.skills.forEach(skill => {
                skillCounts[skill] = (skillCounts[skill] || 0) + 1;
            });
        });

        const sortedSkills = Object.keys(skillCounts)
            .map(skill => ({ name: skill, count: skillCounts[skill] }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 7);

        return {
            total,
            avgCgpa: (sumCgpa / total).toFixed(2),
            totalProjects: sumProjects,
            totalInterns: sumInterns,
            topSkills: sortedSkills
        };
    }
}
