import { StudentProfile } from "../knowledge/schemas/student";
import { KnowledgeBase } from "../knowledge";
import { makeCareerDecision } from "./modules/career-decision";
import { makeCollegeDecision } from "./modules/college-decision";
import { makeCertificationDecision } from "./modules/certification-decision";
import { makeRoadmapDecision } from "./modules/roadmap-decision";
import { ConsoleLogger } from "../services/logger";

async function runDecisionDemo() {
  const logger = new ConsoleLogger("DecisionDemo");
  logger.info("Starting Decision Engine Demonstration...");

  // Validate all datasets before starting
  logger.info("Validating Knowledge Base...");
  const isValid = KnowledgeBase.validateAll();
  if (!isValid) {
    logger.error("Dataset validation failed. Aborting demo.");
    process.exit(1);
  }
  logger.info("Knowledge Base validation: SUCCESS.");

  // 1. Define a Mock Student Profile
  const mockStudent: StudentProfile = {
    version: "1.0.0",
    lastUpdated: "2026-07-16",
    id: "student-sindhu",
    name: "Sindhu Sharma",
    exam: "JEE Mains",
    rank: 4500,
    collegesAvailable: [], // Empty means scan all registered colleges
    branchAllocated: "Mechanical Engineering",
    budget: 300000, // Maximum annual fee budget: 300,000 INR
    preferredLocation: ["New Delhi", "Bengaluru"],
    interests: ["Artificial Intelligence", "Machine Learning", "Software Engineering"],
    preferredCareer: ["career-ai-engineer"],
    hostelPreference: true,
    currentSkills: ["Python", "Basic SQL", "Linear Algebra"],
    preferredLearningStyle: "PRACTICAL",
    preferredCompanyType: ["STARTUP", "PRODUCT"],
    higherStudiesInterest: false,
    entrepreneurshipInterest: true,
    metadata: {
      currentSemester: 4, // Student is in semester 4
    },
  };

  logger.info("Loaded Student Profile for analysis.");

  const timestamp = "2026-07-16T22:00:00.000Z";

  // 2. Execute Career Recommendations
  logger.info("Executing Career Decisions...");
  const careerRecommendations = makeCareerDecision(
    mockStudent,
    KnowledgeBase.careers,
    undefined,
    timestamp
  );

  // 3. Select Top Career
  const topCareerRec = careerRecommendations[0];
  const topCareer = topCareerRec.data;
  logger.info(`Top Aligned Career identified: '${topCareer.name}' (ID: ${topCareer.id})`);

  // 4. Execute College Recommendations
  logger.info("Executing College Decisions...");
  const collegeRecommendations = makeCollegeDecision(
    mockStudent,
    KnowledgeBase.colleges,
    undefined,
    timestamp
  );

  // 5. Execute Certification Recommendations
  logger.info("Executing Certification Decisions...");
  const certRecommendations = makeCertificationDecision(
    mockStudent,
    topCareer,
    KnowledgeBase.certifications,
    undefined,
    timestamp
  );

  // 6. Execute Personalized Roadmap Generation
  logger.info("Executing Roadmap Personalization...");
  const roadmapRecommendation = makeRoadmapDecision(
    mockStudent,
    topCareer,
    certRecommendations,
    KnowledgeBase.roadmaps,
    timestamp
  );

  // ==========================================
  // OUTPUT RESULTS - STRICTLY STRUCTURED JSON
  // ==========================================
  logger.info("----------------------------------------------------------------");
  logger.info("JSON OUTPUT: CAREER ALIGNMENT RESULT (TOP RECOMMENDED CAREER)");
  logger.info("----------------------------------------------------------------");
  console.log(JSON.stringify(topCareerRec, null, 2));

  logger.info("----------------------------------------------------------------");
  logger.info("JSON OUTPUT: COLLEGE RECOMMENDATION RESULT (TOP RECOMMENDED COLLEGE)");
  logger.info("----------------------------------------------------------------");
  console.log(JSON.stringify(collegeRecommendations[0], null, 2));

  logger.info("----------------------------------------------------------------");
  logger.info("JSON OUTPUT: CERTIFICATIONS RECOMMENDATIONS (TOP 2 RECOMMENDATIONS)");
  logger.info("----------------------------------------------------------------");
  console.log(JSON.stringify(certRecommendations.slice(0, 2), null, 2));

  logger.info("----------------------------------------------------------------");
  logger.info("JSON OUTPUT: PERSONALIZED ROADMAP GENERATION RESULT");
  logger.info("----------------------------------------------------------------");
  console.log(JSON.stringify(roadmapRecommendation, null, 2));
}

runDecisionDemo().catch((err) => {
  console.error("Fatal Error running decision demo:", err);
});
