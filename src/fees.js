export const EARLY_END = Date.parse('2027-02-02T00:00:00+01:00');
export const authorFees = {one:[290,340],two:[420,470],three:[530,580]};
export const guestFees = [200,250];
export function currentFee(kind,plan='one',now=Date.now()){const fees=kind==='guestRegistrations'?guestFees:authorFees[plan];return fees?fees[now<EARLY_END?0:1]:null;}
