import { ApiClient } from "./api";
import { StudentProfile } from "../../src/knowledge/schemas/student";
import { SummaryResponse } from "../../src/presentation/decision-summary-service";

export class CounsellingApi {
  public static async submitProfile(profile: StudentProfile): Promise<SummaryResponse> {
    return ApiClient.post<StudentProfile, SummaryResponse>("/api/counselling", profile);
  }
}
