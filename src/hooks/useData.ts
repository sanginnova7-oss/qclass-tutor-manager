import { useEffect, useState } from 'react';
import { db } from '../services/db';

export function useData() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  return {
    settings: db.getSettings(),
    students: db.getStudents(),
    classes: db.getClasses(),
    packages: db.getPackages(),
    payments: db.getPayments(),
    attendance: db.getAttendance(),
    sessions: db.getSessions(),
    tests: db.getTests(),
    scores: db.getScores(),
    homework: db.getHomework(),
    homeworkResults: db.getHomeworkResults(),
    notes: db.getNotes(),
    activities: db.getActivities(),
    tuitionSummaries: db.getAllTuitionSummaries(),
    // V3 data
    currentUser: db.getCurrentUser(),
    users: db.getAllUsers(),
    questions: db.getQuestionBank(),
    onlineTests: db.getOnlineTests(),
    testAttempts: db.getTestAttempts(),
    leads: db.getLeads(),
    trials: db.getTrials(),
    resources: db.getResources(),
    announcements: db.getAnnouncements(),
    notifications: db.getNotifications(),
    automationRules: db.getAutomationRules(),
    db,
  };
}
