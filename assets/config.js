// Shared configuration — edit texts here; the form and admin dashboard both read this.
window.FB_CONFIG = {
  apiBase: "https://feedback-api.ariel-crm.workers.dev",
  courseTitle: "מובילים חדשנות באקדמיה — DATA & AI",
  orgLine1: "אוניברסיטת אריאל בשומרון",
  orgLine2: "מצוינות אקדמית, מחקר יישומי וחדשנות",
  badge: "אגף משאבי אנוש · שאלון משוב",
  scale: [
    { emoji: "😞", value: 1, label: "כלל לא מרוצה" },
    { emoji: "🙁", value: 2, label: "לא כל כך מרוצה" },
    { emoji: "😐", value: 3, label: "במידה בינונית" },
    { emoji: "😊", value: 4, label: "מרוצה" },
    { emoji: "🤩", value: 5, label: "מרוצה מאוד" },
  ],
  instructors: [
    { key: "instructor_erez", name: "ארז", topic: "Excel" },
    { key: "instructor_sima", name: "סימה", topic: "Power BI" },
    { key: "instructor_leon", name: "לאון", topic: "בינה מלאכותית (AI)" },
  ],
  ratingFields: [
    { key: "instructor_erez", label: "ארז — Excel" },
    { key: "instructor_sima", label: "סימה — Power BI" },
    { key: "instructor_leon", label: "לאון — בינה מלאכותית" },
    { key: "relevance_rating", label: "רלוונטיות החומר" },
    { key: "environment_rating", label: "סביבת הלמידה והארגון" },
    { key: "overall_rating", label: "שביעות רצון כללית" },
  ],
  commentFields: [
    { key: "instructor_comments", label: "הערות על המרצים" },
    { key: "relevance_comments", label: "הערות על רלוונטיות החומר" },
    { key: "environment_comments", label: "הערות על סביבת הלמידה" },
    { key: "overall_comments", label: "הערות כלליות" },
    { key: "improvement_comments", label: "נקודות לשימור ולשיפור" },
  ],
};
