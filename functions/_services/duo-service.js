// Service: Study Duos
// Business logic for shared courses with auto-battle when both partners finish
// Cross-service dependency: uses BattleService for auto-battle creation

import { DuoRepo } from '../_repositories/duo-repo.js';
import { BattleService } from './battle-service.js';
import { ValidationError, NotFoundError, requireFields } from '../_shared/validators.js';
import { generateId } from '../_shared/utils.js';

export const DuoService = {
    /**
     * Create a new study duo — stores the full course for the partner to load
     */
    async create(db, data) {
        if (!data.topic || !data.courseData) {
            throw new ValidationError('Missing required fields: topic and courseData are required');
        }

        const id = generateId();

        try {
            await DuoRepo.ensureTable(db);
        } catch (e) {
            console.error('Table creation warning:', e);
            // Table might already exist, continue
        }

        await DuoRepo.create(db, { id, ...data });
        return { duoId: id, success: true };
    },

    /**
     * Get duo data — partner loads the shared course from here
     */
    async get(db, duoId) {
        if (!duoId) throw new ValidationError('Duo ID required');

        try {
            await DuoRepo.ensureTable(db);
        } catch (e) {
            // Table might already exist, continue
        }

        const duo = await DuoRepo.findById(db, duoId);
        if (!duo) throw new NotFoundError('Study duo not found');

        const result = {
            id: duo.id,
            creatorName: duo.creator_name,
            topic: duo.topic,
            courseTitle: duo.course_title,
            courseData: JSON.parse(duo.course_data),
            status: duo.status,
            createdAt: duo.created_at,
        };

        if (duo.creator_quiz_score !== null) {
            result.creatorQuizScore = duo.creator_quiz_score;
        }
        if (duo.partner_quiz_score !== null) {
            result.partnerName = duo.partner_name;
            result.partnerQuizScore = duo.partner_quiz_score;
        }
        if (duo.battle_id) {
            result.battleId = duo.battle_id;
        }

        return result;
    },

    /**
     * Handle quiz completion — store score, auto-create battle when both are done
     * This is the cross-service orchestration point: Duo → Battle
     */
    async handleQuizComplete(db, data) {
        requireFields(data, ['duoId', 'role']);
        if (data.score === undefined) {
            throw new ValidationError('Missing required fields: score');
        }

        try {
            await DuoRepo.ensureTable(db);
        } catch (e) {
            // Table might already exist, continue
        }

        const duo = await DuoRepo.findById(db, data.duoId);
        if (!duo) throw new NotFoundError('Study duo not found');

        // Store score based on role
        if (data.role === 'creator') {
            await DuoRepo.updateCreatorQuiz(db, data.duoId, {
                score: data.score,
                answers: data.answers,
            });
        } else {
            await DuoRepo.updatePartnerQuiz(db, data.duoId, {
                partnerName: data.partnerName,
                partnerId: data.partnerId,
                score: data.score,
                answers: data.answers,
            });
        }

        // Re-fetch to check if both have completed
        const updated = await DuoRepo.findById(db, data.duoId);

        if (updated.creator_quiz_score !== null && updated.partner_quiz_score !== null && !updated.battle_id) {
            // Both done! Auto-create a completed battle via BattleService
            const courseData = JSON.parse(updated.course_data);
            const battleId = generateId();

            await BattleService.createCompleted(db, {
                id: battleId,
                challengerName: updated.creator_name,
                challengerId: updated.creator_id,
                topic: updated.topic,
                courseTitle: updated.course_title,
                quizData: courseData.quiz || [],
                challengerScore: updated.creator_quiz_score,
                challengerAnswers: updated.creator_quiz_answers || '[]',
                opponentName: updated.partner_name || 'Study Buddy',
                opponentScore: updated.partner_quiz_score,
                opponentAnswers: updated.partner_quiz_answers || '[]',
            });

            await DuoRepo.linkBattle(db, data.duoId, battleId);

            return {
                success: true,
                battleReady: true,
                battleId,
                creatorName: updated.creator_name,
                creatorScore: updated.creator_quiz_score,
                partnerName: updated.partner_name,
                partnerScore: updated.partner_quiz_score,
            };
        }

        return {
            success: true,
            battleReady: false,
            waitingFor: updated.creator_quiz_score === null ? 'creator' : 'partner',
        };
    },
};
