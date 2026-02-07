// Service: Learning Battles
// Business logic for 1v1 quiz challenges with anti-cheat and server-side scoring
// Orchestrates repositories — no HTTP concepts, no D1 SQL

import { BattleRepo } from '../_repositories/battle-repo.js';
import { ValidationError, NotFoundError, requireFields } from '../_shared/validators.js';
import { generateId } from '../_shared/utils.js';

export const BattleService = {
    /**
     * Create a new battle challenge — generates shareable ID
     */
    async create(db, data) {
        requireFields(data, ['topic', 'quizData']);
        if (data.challengerScore === undefined) {
            throw new ValidationError('Missing required fields: challengerScore');
        }

        const id = generateId();
        await BattleRepo.ensureTable(db);
        await BattleRepo.create(db, { id, ...data });

        return { battleId: id, success: true };
    },

    /**
     * Get battle data — strips correct answers for pending battles (anti-cheat)
     */
    async get(db, battleId) {
        if (!battleId) throw new ValidationError('Battle ID required');

        await BattleRepo.ensureTable(db);
        const battle = await BattleRepo.findById(db, battleId);
        if (!battle) throw new NotFoundError('Battle not found');

        const result = {
            id: battle.id,
            challengerName: battle.challenger_name,
            topic: battle.topic,
            courseTitle: battle.course_title,
            status: battle.status,
            createdAt: battle.created_at,
            quizData: JSON.parse(battle.quiz_data),
        };

        // Anti-cheat: strip correct answers for pending battles
        if (battle.status === 'pending') {
            result.quizData = result.quizData.map(q => ({
                question: q.question,
                options: q.options,
                // correctIndex and explanation withheld
            }));
        }

        // Include full results for completed battles
        if (battle.status === 'completed') {
            result.challengerScore = battle.challenger_score;
            result.opponentName = battle.opponent_name;
            result.opponentScore = battle.opponent_score;
            result.completedAt = battle.completed_at;
            result.quizData = JSON.parse(battle.quiz_data); // Full quiz with answers
        }

        return result;
    },

    /**
     * Submit opponent's answers — verifies score server-side for integrity
     */
    async submit(db, data) {
        requireFields(data, ['battleId', 'opponentName']);
        if (data.opponentScore === undefined) {
            throw new ValidationError('Missing required fields: opponentScore');
        }

        await BattleRepo.ensureTable(db);
        const battle = await BattleRepo.findById(db, data.battleId);
        if (!battle) throw new NotFoundError('Battle not found');

        // Already completed — return existing results
        if (battle.status === 'completed') {
            return {
                alreadyCompleted: true,
                challengerName: battle.challenger_name,
                challengerScore: battle.challenger_score,
                opponentName: battle.opponent_name,
                opponentScore: battle.opponent_score,
                topic: battle.topic,
            };
        }

        // Server-side score verification — never trust client score
        const quizData = JSON.parse(battle.quiz_data);
        const answers = data.opponentAnswers || [];
        let correct = 0;
        quizData.forEach((q, i) => {
            if (answers[i] === q.correctIndex) correct++;
        });
        const verifiedScore = Math.round((correct / quizData.length) * 100);

        await BattleRepo.complete(db, data.battleId, {
            opponentName: data.opponentName,
            opponentScore: verifiedScore,
            opponentAnswers: answers,
        });

        return {
            success: true,
            challengerName: battle.challenger_name,
            challengerScore: battle.challenger_score,
            opponentName: data.opponentName,
            opponentScore: verifiedScore,
            topic: battle.topic,
            courseTitle: battle.course_title,
            quizData, // Full quiz with answers for results review
        };
    },

    /**
     * Create a pre-completed battle (used by DuoService when both partners finish)
     */
    async createCompleted(db, data) {
        await BattleRepo.ensureTable(db);
        await BattleRepo.createCompleted(db, data);
    },
};
