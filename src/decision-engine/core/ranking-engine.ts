import { DecisionResult } from "./types";

/**
 * Sorting and tie-resolution engine for recommendations.
 */
export class RankingEngine {
  /**
   * Sorts candidate outputs by final scores in descending order and assigns rankings.
   * Handles ties using Standard Competition Ranking rules (1, 2, 2, 4...) and optional custom tie-breakers.
   * @param results Unranked candidate decision results.
   * @param tieBreaker Optional tie-breaker callback to resolve score collisions.
   * @returns Array of ranked DecisionResults.
   */
  public static rank<T>(
    results: Omit<DecisionResult<T>, "ranking">[],
    tieBreaker?: (
      a: Omit<DecisionResult<T>, "ranking">,
      b: Omit<DecisionResult<T>, "ranking">
    ) => number
  ): DecisionResult<T>[] {
    const sorted = [...results].sort((a, b) => {
      // Primary sorting: Higher score runs first
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      // Secondary sorting: Optional tie breaker logic
      if (tieBreaker) {
        return tieBreaker(a, b);
      }

      return 0;
    });

    // Assign ranking indexes (handling equivalent scores with duplicate ranks)
    let currentRank = 1;
    return sorted.map((res, index, array) => {
      if (index > 0 && res.score < array[index - 1].score) {
        currentRank = index + 1; // standard competition rank spacing
      }
      return {
        ...res,
        ranking: currentRank,
      } as DecisionResult<T>;
    });
  }
}
