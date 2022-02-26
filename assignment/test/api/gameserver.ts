import * as _chai from 'chai';
import { Game } from '../../src/index';
import 'mocha';
import * as money from '../../src/types/money';
import { GameServer } from '../../src/api/gameserver';

describe('api gameserver constructor', () => {
    it('can construct', () => {
        let gs = new GameServer()
        _chai.assert.instanceOf(gs, GameServer)
    })
})

describe('api gameserver startgame', () => {
    it('returns game instance which can call turn', () => {
        let gs = new GameServer()
        let g = gs.startGame("British", 2)
        _chai.assert.equal(g.id, 0)
        _chai.assert.equal(g.turn.stage, "Roll")
        if(g.turn.stage == "Roll"){
            g.turn.roll(1)
        }
    })
})

describe('api gameserver getGame', () => {
    it('returns game isntance which can call if id valid', () => {
        let gs = new GameServer()
        gs.startGame("British", 2)
        let g = gs.getGame(0)
        _chai.assert.equal(g?.id, 0)
        _chai.assert.equal(g?.turn.stage, "Roll")
        if(g?.turn.stage == "Roll"){
            g?.turn.roll(1)
        }
    })
    it('returns undefined if game doesnt exist', () => {
        let gs = new GameServer()
        gs.startGame("British", 2)
        let g = gs.getGame(1)
        _chai.assert.isUndefined(g)
    })
})