
import React from 'react';
import { FunnelStage, LeadStatus } from '../types';
import { TrendingUp, Users, Target, CheckCircle } from 'lucide-react';

interface LeadAnalysisProps {
  stage: FunnelStage;
  status: LeadStatus;
  score: number;
  nextStep: string;
}

const LeadAnalysis: React.FC<LeadAnalysisProps> = ({ stage, status, score, nextStep }) => {
  const stages = Object.values(FunnelStage);
  const currentStageIndex = stages.indexOf(stage);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Status do Lead
        </h2>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
          status === LeadStatus.HOT ? 'bg-red-100 text-red-600' :
          status === LeadStatus.QUALIFIED ? 'bg-green-100 text-green-600' :
          status === LeadStatus.WARM ? 'bg-yellow-100 text-yellow-600' :
          'bg-gray-100 text-gray-600'
        }`}>
          {status}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1 font-medium">
            <span>Score de Qualificação</span>
            <span>{score}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">Progresso no Funil</p>
          <div className="flex flex-col gap-1">
            {stages.map((s, idx) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                  idx <= currentStageIndex ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                }`}>
                  {idx < currentStageIndex && <CheckCircle className="w-3 h-3 text-white" />}
                  {idx === currentStageIndex && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                </div>
                <span className={`text-xs ${idx <= currentStageIndex ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-50">
          <p className="text-xs text-gray-500 uppercase font-bold mb-1">Próximo Passo Estratégico</p>
          <p className="text-sm text-gray-700 italic">"{nextStep || 'Aguardando interação...'}"</p>
        </div>
      </div>
    </div>
  );
};

export default LeadAnalysis;
