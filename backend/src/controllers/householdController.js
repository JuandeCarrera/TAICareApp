import * as householdService from '../services/householdService.js';

export const create = async (req, res, next) => {
    try {
        const result = await householdService.createHousehold(req.body, req.user);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const list = async (req, res, next) => {
    try {
        const result = await householdService.listHouseholds(req.user);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const get = async (req, res, next) => {
    try {
        const result = await householdService.getHouseholdById(
            req.params.id,
            req.user
        );
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const update = async (req, res, next) => {
    try {
        const result = await householdService.updateHousehold(
            req.params.id,
            req.body,
            req.user
        );
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const remove = async (req, res, next) => {
    try {
        await householdService.deleteHousehold(req.params.id, req.user);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
};

export const addRoom = async (req, res, next) => {
    try {
        const result = await householdService.addRoom(
            req.params.id,
            req.body.room,
            req.user
        );
        res.json(result);
    } catch (error) {
        next(error);
    }
};
