import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PrintableEncaminhamentoProps {
    encaminhamento: any;
    onClose: () => void;
}

export const PrintableEncaminhamento: React.FC<PrintableEncaminhamentoProps> = ({
    encaminhamento,
    onClose
}) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 500);

        const handleAfterPrint = () => {
            onClose();
        };

        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, [onClose]);

    if (!encaminhamento) return null;

    const isInfantil = encaminhamento.etapa === 'infantil';

    const content = (
        <div className="print-only" style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
            <style>
                {`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    .print-only, .print-only * {
                        visibility: visible !important;
                    }
                    .print-only {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        padding: 20px !important;
                        margin: 0 !important;
                        background: white !important;
                    }
                }
                `}
            </style>
            
            <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '20px' }}>
                <h1 style={{ margin: 0, fontSize: '24px', textTransform: 'uppercase' }}>Registro de Encaminhamento e Intervenção</h1>
                <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#555' }}>Conselho de Classe - {isInfantil ? 'Educação Infantil' : 'Ensino Fundamental'}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>{isInfantil ? 'Criança' : 'Estudante'}</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{isInfantil ? encaminhamento.crianca : encaminhamento.estudante}</p>
                </div>
                <div>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>{isInfantil ? 'Agrupamento / Turma' : 'Turma'}</p>
                    <p style={{ margin: 0, fontSize: '16px' }}>{isInfantil ? encaminhamento.agrupamento : encaminhamento.turma}</p>
                </div>
                <div>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Data do Registro</p>
                    <p style={{ margin: 0, fontSize: '16px' }}>{encaminhamento.data}</p>
                </div>
                <div>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Período Letivo</p>
                    <p style={{ margin: 0, fontSize: '16px' }}>{encaminhamento.periodoLetivo}</p>
                </div>
                <div>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>{isInfantil ? 'Campo de Experiência' : 'Tipo de Intervenção'}</p>
                    <p style={{ margin: 0, fontSize: '16px' }}>{isInfantil ? encaminhamento.campoExperiencia : encaminhamento.tipo}</p>
                </div>
                <div>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Status</p>
                    <p style={{ margin: 0, fontSize: '16px' }}>{encaminhamento.status}</p>
                </div>
            </div>

            <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>
                    {isInfantil ? 'Evidências Observadas / Motivo do Registro' : 'Descrição do Caso / Motivo'}
                </p>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>{isInfantil ? encaminhamento.evidencias : encaminhamento.descricao}</p>
            </div>

            <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#fdf4ff', border: '1px solid #fce7f3', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>
                    {isInfantil ? 'Estratégia Pedagógica / Intervenção Proposta' : 'Encaminhamento / Ação Proposta'}
                </p>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>{isInfantil ? encaminhamento.estrategia : encaminhamento.encaminhamento}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '40px', marginTop: '40px' }}>
                <div>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>{isInfantil ? 'Professor(a)' : 'Responsável pela Ação'}</p>
                    <p style={{ margin: 0, fontSize: '16px' }}>{isInfantil ? encaminhamento.professor : encaminhamento.responsavel}</p>
                </div>
                <div style={{ width: '300px', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '10px' }}>
                    <p style={{ margin: 0, fontSize: '12px' }}>Assinatura do(a) Responsável</p>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};
