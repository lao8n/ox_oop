import * as _chai from 'chai';
import { DataFactory } from '../../data/uk';
import { Board } from '../../src/services/board';
import { Owner, Ownership } from '../../src/services/ownership';
import { Players } from "../../src/services/players";
import { Transfer } from '../../src/services/transfer';
import { GenericBoard, MonopolyBoard } from '../../src/types/board';
import * as money from "../../src/types/money";

describe('service transfer constructor', () => {
    it('can construct transfer with GBP currency', 
    () => {
        let m = DataFactory.createMonopolyBoard<money.GBP>()
        let b = new Board<money.GBP, MonopolyBoard<money.GBP>>(m)
        let p = new Players<money.GBP>(4)
        let o = new Ownership<money.GBP, MonopolyBoard<money.GBP>>(m)
        let t = new Transfer<money.GBP, MonopolyBoard<money.GBP>>(b, p, o)
        _chai.assert.instanceOf(t, Transfer);
    });
});

describe('service transfer pay rent', () => {
    it('can pay from one user to another', 
    () => {
        let m = DataFactory.createMonopolyBoard<money.GBP>()
        let b = new Board<money.GBP, MonopolyBoard<money.GBP>>(m)
        let p = new Players<money.GBP>(4)
        let o = new Ownership<money.GBP, MonopolyBoard<money.GBP>>(m)
        let t = new Transfer<money.GBP, MonopolyBoard<money.GBP>>(b, p, o)
        let deed = m[1][2]
        t.buyProperty(2, deed)
        let result = t.payRent(1, deed)
        _chai.assert.isTrue(result)
        _chai.assert.equal(p.getWealth(1), 1498n as money.GBP)
        _chai.assert.equal(p.getWealth(2), 1442n as money.GBP)
    });
    it('can pay from one user to another with doubling for all owned', 
    () => {
        let m = DataFactory.createMonopolyBoard<money.GBP>()
        let b = new Board<money.GBP, MonopolyBoard<money.GBP>>(m)
        let p = new Players<money.GBP>(4)
        let o = new Ownership<money.GBP, MonopolyBoard<money.GBP>>(m)
        let t = new Transfer<money.GBP, MonopolyBoard<money.GBP>>(b, p, o)
        let deed1 = m[1][2]
        t.buyProperty(2, deed1)
        let deed2 = m[1][4]
        t.buyProperty(2, deed2)
        let result = t.payRent(1, deed1)
        _chai.assert.isTrue(result)
        _chai.assert.equal(p.getWealth(1), 1496n as money.GBP)
        _chai.assert.equal(p.getWealth(2), 1384n as money.GBP)
        result = t.payRent(1, deed2)
        _chai.assert.isTrue(result)
        _chai.assert.equal(p.getWealth(1), 1488n as money.GBP)
        _chai.assert.equal(p.getWealth(2), 1392n as money.GBP)
    });
});

describe('service transfer buy property', () => {
    it('can buy property if unowned, but once owned cannot buy', 
    () => {
        let m = DataFactory.createMonopolyBoard<money.GBP>()
        let b = new Board<money.GBP, MonopolyBoard<money.GBP>>(m)
        let p = new Players<money.GBP>(4)
        let o = new Ownership<money.GBP, MonopolyBoard<money.GBP>>(m)
        let t = new Transfer<money.GBP, MonopolyBoard<money.GBP>>(b, p, o)
        let deed = m[1][2]
        let result = t.buyProperty(1, deed)
        _chai.assert.isTrue(result)
        _chai.assert.equal(p.getWealth(1), 1440n as money.GBP)
        _chai.assert.deepEqual(o.getOwner(deed.name), 
            {id:1, sameOwner: false} as Owner)
        result = t.buyProperty(2, deed)
        _chai.assert.isFalse(result)
        _chai.assert.equal(p.getWealth(1), 1440n as money.GBP)
        _chai.assert.equal(p.getWealth(2), 1500n as money.GBP)
        _chai.assert.deepEqual(o.getOwner(deed.name), 
            {id:1, sameOwner: false} as Owner)
    });
});