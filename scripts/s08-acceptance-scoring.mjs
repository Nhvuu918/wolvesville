/** Metric A and Metric B are INDEPENDENT. B may be reached without match completion. */
export function qualifiesMetricA(evidence){
 return !!(evidence && evidence.result==='PASS' && evidence.backendRunVerified===true && evidence.gameCompleted===true && evidence.winnerCommitted===true && evidence.eventLogVerified===true && evidence.privateAclVerified===true && evidence.restartReplayVerified===true);
}
export function qualifiesMetricB(evidence){
 return !!(evidence && evidence.result==='PASS' && evidence.backendRunVerified===true && evidence.eventLogVerified===true && evidence.privateAclVerified===true && evidence.restartReplayVerified===true && evidence.throughNight===true && evidence.throughDay===true && evidence.throughVoting===true && evidence.voteResolved===true && evidence.verifiedVoteRuleSource===true && evidence.eliminationFromVote===true && evidence.victoryChecked===true);
}
export function scoreConfigEvidence(configs){
 const ids=new Set();let metricA=0,metricB=0;
 for(const c of configs){
  if(ids.has(c.key))throw new Error(`duplicate configuration: ${c.key}`);ids.add(c.key);
  if(c.metricA!==qualifiesMetricA(c.evidence))throw new Error(`Metric A evidence mismatch: ${c.key}`);
  if(c.metricB!==qualifiesMetricB(c.evidence))throw new Error(`Metric B evidence mismatch: ${c.key}`);
  metricA+=Number(c.metricA);metricB+=Number(c.metricB);
 }
 return {metricA,metricB};
}
