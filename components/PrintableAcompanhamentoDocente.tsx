import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PrintableAcompanhamentoDocenteProps {
    acompanhamento: any;
    onClose: () => void;
}

export const PrintableAcompanhamentoDocente: React.FC<PrintableAcompanhamentoDocenteProps> = ({
    acompanhamento,
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

    if (!acompanhamento) return null;

    const isInfantil = acompanhamento.etapa === 'infantil';

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
                <h1 style={{ margin: 0, fontSize: '24px', textTransform: 'uppercase' }}>Acompanhamento Docente</h1>
                <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#555' }}>Conselho de Classe - {isInfantil ? 'Educação Infantil' : 'Ensino Fundamental'}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Professor(a) Responsável</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{acompanhamento.professor}</p>
                </div>
                <div>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>{isInfantil ? 'Agrupamento / Turma' : 'Turma'}</p>
                    <p style={{ margin: 0, fontSize: '16px' }}>{isInfantil ? acompanhamento.agrupamento : acompanhamento.turma}</p>
                </div>
                <div>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>{isInfantil ? 'Campo de Experiência (BNCC)' : 'Componente Curricular'}</p>
                    <p style={{ margin: 0, fontSize: '16px' }}>{isInfantil ? acompanhamento.campoExperiencia : acompanhamento.componente}</p>
                </div>
                <div>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Período Letivo</p>
                    <p style={{ margin: 0, fontSize: '16px' }}>{acompanhamento.periodoLetivo}</p>
                </div>
                <div>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Data do Registro</p>
                    <p style={{ margin: 0, fontSize: '16px' }}>{acompanhamento.data}</p>
                </div>
                <div>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>{isInfantil ? 'Criança em Observação' : 'Líder de Turma'}</p>
                    <p style={{ margin: 0, fontSize: '16px' }}>{isInfantil ? acompanhamento.crianca : acompanhamento.lider}</p>
                </div>
            </div>

            {!isInfantil && (
                <div style={{ marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Estudante com Dificuldade</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{acompanhamento.estudante}</p>
                </div>
            )}

            {isInfantil && acompanhamento.tipoInteracao && (
                <div style={{ marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Tipo de Interação Predominante</p>
                    <p style={{ margin: 0, fontSize: '16px' }}>{acompanhamento.tipoInteracao}</p>
                </div>
            )}

            <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>
                    {isInfantil ? 'Evidências de Aprendizagem e Desenvolvimento' : 'Dificuldades Encontradas'}
                </p>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>{isInfantil ? acompanhamento.evidencias : acompanhamento.dificuldades}</p>
            </div>

            <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 'bold', color: '#166534', textTransform: 'uppercase' }}>
                    {isInfantil ? 'Intencionalidade Pedagógica / Mediação do Professor' : 'Intervenção Pedagógica do Professor'}
                </p>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>{isInfantil ? acompanhamento.intencionalidade : acompanhamento.intervencao}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '40px', marginTop: '40px' }}>
                <div>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Professor(a) Responsável</p>
                    <p style={{ margin: 0, fontSize: '16px' }}>{acompanhamento.professor}</p>
                </div>
                <div style={{ width: '300px', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '10px' }}>
                    <p style={{ margin: 0, fontSize: '12px' }}>Assinatura do(a) Professor(a)</p>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};
