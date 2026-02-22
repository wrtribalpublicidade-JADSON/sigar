import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

export const generateAtaDocx = async (reuniao: any) => {
    const currentYear = new Date().getFullYear();
    const emissionDate = new Date().toLocaleDateString('pt-BR');
    const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let formattedDate = reuniao.dataReuniao;
    if (formattedDate && formattedDate.includes('-')) {
        const parts = formattedDate.split('-');
        formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    // Institutional Header
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: 'ESTADO DO MARANHÃO', bold: true, size: 20 }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: 'PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS', bold: true, size: 24 }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: 'SECRETARIA MUNICIPAL DE EDUCAÇÃO', bold: true, size: 20 }),
                        ],
                    }),
                    new Paragraph({ text: '', spacing: { after: 200 } }),

                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        heading: HeadingLevel.HEADING_1,
                        children: [
                            new TextRun({ text: 'ATA DE REUNIÃO', bold: true, size: 32 }),
                        ],
                    }),
                    new Paragraph({ text: '', spacing: { after: 400 } }),

                    // Identification Block
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: '1. Identificação', bold: true, size: 24 })],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: 'Pauta: ', bold: true }),
                            new TextRun(reuniao.pauta || 'Não informada')
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: 'Data: ', bold: true }),
                            new TextRun(formattedDate || '--/--/----'),
                            new TextRun({ text: '   Horário: ', bold: true }),
                            new TextRun(`${reuniao.horaInicio || '--:--'} às ${reuniao.horaFim || '--:--'}`),
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: 'Local: ', bold: true }),
                            new TextRun(reuniao.local || 'Não informado'),
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: 'Tipo de Reunião: ', bold: true }),
                            new TextRun(reuniao.tipo || 'Não informado'),
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: 'Responsável/Convocante: ', bold: true }),
                            new TextRun(reuniao.responsavel || 'Não informado'),
                        ]
                    }),
                    new Paragraph({ text: '', spacing: { after: 400 } }),

                    // Record Text Block
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: '2. Relato/Registro da Reunião', bold: true, size: 24 })],
                    }),
                    new Paragraph({
                        text: reuniao.registro || '(Nenhum relato detalhado registrado para esta reunião)',
                        spacing: { before: 100, after: 400 },
                    }),

                    // Encaminhamentos Block
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: '3. Encaminhamentos e Decisões', bold: true, size: 24 })],
                    }),
                    new Paragraph({
                        text: reuniao.encaminhamentos || '(Nenhum encaminhamento ou decisão registrado)',
                        spacing: { before: 100, after: 400 },
                    }),

                    // Participants Loop
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: `4. Lista de Presença (${reuniao.participantes?.length || 0})`, bold: true, size: 24 })],
                    }),
                    ...(reuniao.participantes && reuniao.participantes.length > 0 ? reuniao.participantes.map((p: string) =>
                        new Paragraph({
                            children: [
                                new TextRun({ text: p, size: 22 }),
                            ],
                            spacing: { before: 100, after: 100 },
                            border: { bottom: { color: "aaaaaa", space: 1, size: 6, style: BorderStyle.SINGLE } }
                        })
                    ) : [new Paragraph({ text: 'Nenhum participante registrado.' })]),

                    new Paragraph({ text: '', spacing: { after: 800 } }),

                    // Signatures
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: '____________________________________________________' }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: reuniao.responsavel || 'Responsável', bold: true, size: 22 }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: 'Responsável / Convocante', size: 18 }),
                        ],
                    }),

                    new Paragraph({ text: '', spacing: { after: 800 } }),

                    // Footer
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: `SIGAR • Documento Gerado em ${emissionDate} às ${emissionTime}`, size: 16 }),
                        ],
                    }),
                ],
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Ata_Reuniao_${formattedDate?.replace(/\//g, '-')}.docx`);
};
