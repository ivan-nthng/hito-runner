import type { HitoProductApiFailure } from "@/lib/product-api-error-contract";
import { formatUiNumber, type ResolvedUiLocale } from "@/lib/ui-locale";

export interface HitoSharedShellMessages {
  languageMenu: {
    menuLabel: string;
    optionLabels: Record<ResolvedUiLocale, string>;
    deviceStatus: Record<ResolvedUiLocale, string>;
    explicitStatus: Record<ResolvedUiLocale, string>;
    resetToDevice: string;
  };
}

export const HITO_SHARED_SHELL_MESSAGES = {
  en: {
    languageMenu: {
      menuLabel: "Language",
      optionLabels: {
        en: "English",
        "pt-BR": "Português (Brasil)",
      },
      deviceStatus: {
        en: "Device language: English",
        "pt-BR": "Device language: Portuguese (Brazil)",
      },
      explicitStatus: {
        en: "Selected language: English",
        "pt-BR": "Selected language: Portuguese (Brazil)",
      },
      resetToDevice: "Use device language",
    },
  },
  "pt-BR": {
    languageMenu: {
      menuLabel: "Idioma",
      optionLabels: {
        en: "English",
        "pt-BR": "Português (Brasil)",
      },
      deviceStatus: {
        en: "Idioma do dispositivo: inglês",
        "pt-BR": "Idioma do dispositivo: português (Brasil)",
      },
      explicitStatus: {
        en: "Idioma selecionado: inglês",
        "pt-BR": "Idioma selecionado: português (Brasil)",
      },
      resetToDevice: "Usar o idioma do dispositivo",
    },
  },
} as const satisfies Record<ResolvedUiLocale, HitoSharedShellMessages>;

export function getHitoSharedShellMessages(locale: ResolvedUiLocale): HitoSharedShellMessages {
  return HITO_SHARED_SHELL_MESSAGES[locale];
}

export const HITO_PRODUCT_MESSAGES_PT_BR = {
  "All features are free for you.": "Todos os recursos são gratuitos para você.",
  Beta: "Beta",
  "Beta User": "Usuário Beta",
  Calendar: "Calendário",
  Connections: "Conexões",
  "Dismiss {title}": "Dispensar {title}",
  Distance: "Distância",
  Duration: "Duração",
  Elevation: "Elevação",
  "Elevation gain": "Ganho de elevação",
  "Easy run": "Corrida leve",
  "Dismiss Beta User note": "Dispensar aviso de Usuário Beta",
  "Dismiss preview note": "Dispensar aviso de prévia",
  "Guest runner": "Corredor visitante",
  "Hito home": "Início da Hito",
  "Home unavailable": "Início indisponível",
  "Language preference not saved": "A preferência de idioma não foi salva",
  "Keep the day light unless a small recovery assignment is actually planned.":
    "Mantenha o dia leve, a menos que uma pequena atividade de recuperação esteja realmente planejada.",
  "Leave room for recovery.": "Reserve espaço para a recuperação.",
  "Long run": "Corrida longa",
  "Mark complete": "Marcar como concluído",
  Metric: "Métrica",
  "Next Workout": "Próximo treino",
  "Next workout {date}": "Próximo treino em {date}",
  "No scheduled workout": "Nenhum treino programado",
  "No workout metrics are planned today.": "Nenhuma métrica de treino está planejada para hoje.",
  "Open Connections": "Abrir Conexões",
  "Open profile and heart-rate settings": "Abrir perfil e configurações de frequência cardíaca",
  "Open day": "Abrir dia",
  "Open nearest workout": "Abrir treino mais próximo",
  "Open progress": "Abrir progresso",
  "Open the workout for segment-by-segment instructions.":
    "Abra o treino para ver as instruções de cada segmento.",
  "Open workout": "Abrir treino",
  "On track": "Em dia",
  "Partially off track": "Parcialmente fora do planejado",
  Preview: "Prévia",
  "Preview note": "Aviso de prévia",
  "Preview only": "Somente prévia",
  "Preview plan": "Prévia do plano",
  "Profile & heart rate": "Perfil e frequência cardíaca",
  "Profile setup": "Configuração do perfil",
  Pace: "Ritmo",
  Progress: "Progresso",
  "Progress unavailable": "Progresso indisponível",
  "Quality / Intervals": "Qualidade / Intervalos",
  Rest: "Descanso",
  "Rest day": "Dia de descanso",
  Runner: "Corredor",
  "Runner Calendar": "Calendário do corredor",
  "Runner setup": "Configuração do corredor",
  Setup: "Configuração",
  "Sign in": "Entrar",
  "Sign in to save": "Entre para salvar",
  "Sign out": "Sair",
  "Needs reset": "Precisa ser reajustada",
  Today: "Hoje",
  "Today · {date}": "Hoje · {date}",
  "Today is {today}, while your next Calendar workout is on {nextDate}.":
    "Hoje é {today}, e seu próximo treino no Calendário será em {nextDate}.",
  "Training setup": "Configuração do treino",
  "Try choosing the language again.": "Tente escolher o idioma novamente.",
  "Try again": "Tentar novamente",
  "Try again to reopen the latest activity truth.":
    "Tente novamente para reabrir os dados mais recentes das atividades.",
  "Try again to reopen the latest saved or preview state. If setup is still incomplete, returning home will keep you in the onboarding flow.":
    "Tente novamente para reabrir o estado salvo ou a prévia mais recente. Se a configuração ainda estiver incompleta, voltar ao início manterá você no fluxo de configuração.",
  "View result": "Ver resultado",
  "You can browse the preview here until you sign in and save a plan.":
    "Você pode explorar a prévia até entrar e salvar um plano.",
  "Activity deleted. Progress facts now reflect the backend readback.":
    "Atividade excluída. Os dados de progresso agora refletem a leitura do servidor.",
  "Activity history": "Histórico de atividades",
  "Activity history is updating after this change.":
    "O histórico de atividades está sendo atualizado após esta alteração.",
  "Original file removed. The activity and its progress facts remain.":
    "Arquivo original removido. A atividade e seus dados de progresso permanecem.",
  Plans: "Planos",
  "Running history, progress, and saved plans": "Histórico de corridas, progresso e planos salvos",
  "This view is temporarily unavailable.": "Esta área está temporariamente indisponível.",
  Actions: "Ações",
  "Actions for {date} {activity}": "Ações para {activity} em {date}",
  Activity: "Atividade",
  Cancel: "Cancelar",
  "Could not load activity history": "Não foi possível carregar o histórico de atividades",
  "Check again": "Verificar novamente",
  "Comparable evidence": "Evidências comparáveis",
  "Current values will return when the backend snapshot is ready.":
    "Os valores atuais voltarão quando o snapshot do servidor estiver pronto.",
  "Current and previous 28 days": "28 dias atuais e anteriores",
  "Current weekly facts will return when the update is complete.":
    "Os dados semanais atuais voltarão quando a atualização terminar.",
  "Delete activity": "Excluir atividade",
  "Delete activity from history?": "Excluir atividade do histórico?",
  "Deleting…": "Excluindo…",
  "Garmin file": "Arquivo Garmin",
  "Load more": "Carregar mais",
  "Last 28 days": "Últimos 28 dias",
  "Loading activity history": "Carregando histórico de atividades",
  "Loading recorded activities.": "Carregando atividades registradas.",
  "Loading…": "Carregando…",
  "Longest duration": "Maior duração",
  "Longest run": "Corrida mais longa",
  "No recorded activities": "Nenhuma atividade registrada",
  "No recorded running facts": "Nenhum dado de corrida registrado",
  "Observed pace": "Ritmo observado",
  "Open the workout for its exact Plan vs run comparison.":
    "Abra o treino para ver a comparação exata entre plano e corrida.",
  "Original file removed. Normalized activity facts remain in history and progress, but Hito cannot reprocess the source.":
    "O arquivo original foi removido. Os dados normalizados da atividade permanecem no histórico e no progresso, mas a Hito não pode reprocessar a fonte.",
  "Plan relationship": "Relação com o plano",
  "Privacy and deletion": "Privacidade e exclusão",
  "Recorded activity facts and source controls.":
    "Dados da atividade registrada e controles da fonte.",
  "Recorded running": "Corridas registradas",
  "Recorded running facts, current records, and your reported training load.":
    "Dados registrados de corrida, recordes atuais e sua carga de treino informada.",
  "Reported load": "Carga informada",
  Runs: "Corridas",
  "Running facts": "Dados de corrida",
  "Running time": "Tempo de corrida",
  "Recorded running activities": "Atividades de corrida registradas",
  "Record a run from its workout when you are ready.":
    "Registre uma corrida a partir do treino quando estiver pronto.",
  "Remove file": "Remover arquivo",
  "Remove original file": "Remover arquivo original",
  "Remove original file?": "Remover arquivo original?",
  "Removing…": "Removendo…",
  "Retry file removal": "Tentar remover o arquivo novamente",
  "Retry original file removal?": "Tentar remover o arquivo original novamente?",
  "Retry removal": "Tentar remoção novamente",
  Source: "Fonte",
  "Started {time}": "Iniciada às {time}",
  "The normalized activity stays in history and continues to contribute to progress, but Hito can no longer reprocess the original file.":
    "A atividade normalizada permanece no histórico e continua contribuindo para o progresso, mas a Hito não poderá mais reprocessar o arquivo original.",
  "The original file is retained and can be reprocessed.":
    "O arquivo original está preservado e pode ser reprocessado.",
  "The previous removal did not finish. Retrying removes the original file while keeping the normalized activity in history and progress.":
    "A remoção anterior não terminou. Tentar novamente remove o arquivo original e mantém a atividade normalizada no histórico e no progresso.",
  "The previous removal did not finish. Try removing the original file again.":
    "A remoção anterior não terminou. Tente remover o arquivo original novamente.",
  "This removes the recorded activity, its observed evidence, comparisons, and profile contribution. A separate manually reported completion may remain.":
    "Isso remove a atividade registrada, suas evidências observadas, comparações e contribuição ao perfil. Uma conclusão informada manualmente pode permanecer.",
  "This historical snapshot does not include the current weekly FIT series.":
    "Este snapshot histórico não inclui a série FIT semanal atual.",
  "Unplanned run": "Corrida não planejada",
  Updating: "Atualizando",
  "Updating weekly FIT progress": "Atualizando o progresso FIT semanal",
  "Timer duration": "Duração do cronômetro",
  "Weekly facts": "Dados semanais",
  "Weekly factual chart controls": "Controles do gráfico semanal de dados",
  "Weekly factual chart metric": "Métrica do gráfico semanal de dados",
  "Weekly FIT progress unavailable": "Progresso FIT semanal indisponível",
  "recorded activities": "atividades registradas",
  "View details": "Ver detalhes",
  "Your recorded runs, whether or not they matched a plan.":
    "Suas corridas registradas, tenham ou não correspondido a um plano.",
  "Your activity facts are being refreshed.":
    "Os dados das suas atividades estão sendo atualizados.",
  "Your running history will appear here.": "Seu histórico de corridas aparecerá aqui.",
  "We could not delete this activity. Try again shortly.":
    "Não foi possível excluir esta atividade. Tente novamente em instantes.",
  "We could not load activity history. Try again shortly.":
    "Não foi possível carregar o histórico de atividades. Tente novamente em instantes.",
  "We could not load running progress. Try again shortly.":
    "Não foi possível carregar o progresso de corrida. Tente novamente em instantes.",
  "We could not remove the original file. Try again shortly.":
    "Não foi possível remover o arquivo original. Tente novamente em instantes.",
  "Sign in again before opening activity history.":
    "Entre novamente antes de abrir o histórico de atividades.",
  "Sign in again before opening running progress.":
    "Entre novamente antes de abrir o progresso de corrida.",
  "Sign in again before deleting activity history.":
    "Entre novamente antes de excluir o histórico de atividades.",
  "Sign in again before removing the original activity file.":
    "Entre novamente antes de remover o arquivo de atividade original.",
  "Refresh activity history and try again.":
    "Atualize o histórico de atividades e tente novamente.",
  "The progress period {period} is not available. Choose another period.":
    "O período de progresso {period} não está disponível. Escolha outro período.",
  "This activity is no longer available to delete.":
    "Esta atividade não está mais disponível para exclusão.",
  "This activity is no longer available for file removal.":
    "Esta atividade não está mais disponível para remoção do arquivo.",
  "We could not delete this activity history. Try again shortly.":
    "Não foi possível excluir este histórico de atividade. Tente novamente em instantes.",
  "Activity sequence controls": "Controles da sequência de atividades",
  "Activity sequence metric": "Métrica da sequência de atividades",
  "Activity sequence period": "Período da sequência de atividades",
  "Apply dates": "Aplicar datas",
  "Accepted whole-activity and official results":
    "Resultados aceitos de atividades completas e oficiais",
  "A recent activity change is being applied.":
    "Uma alteração recente de atividade está sendo aplicada.",
  "Based on activity evidence through {date}.": "Com base nas evidências de atividade até {date}.",
  Custom: "Personalizado",
  Current: "Atual",
  "Current record and load values will return when the update is complete.":
    "Os valores atuais de recordes e carga voltarão quando a atualização terminar.",
  "Current records": "Recordes atuais",
  "End date": "Data final",
  "End date cannot be after {date}.": "A data final não pode ser posterior a {date}.",
  "Enter a valid end date in YYYY-MM-DD format.":
    "Informe uma data final válida no formato AAAA-MM-DD.",
  "Enter a valid start date in YYYY-MM-DD format.":
    "Informe uma data inicial válida no formato AAAA-MM-DD.",
  "Last 1 month": "Último mês",
  "Last 6 months": "Últimos 6 meses",
  "Last 7 days": "Últimos 7 dias",
  Historical: "Histórico",
  "Hito only shows exact whole-activity records and official results entered by you.":
    "A Hito mostra apenas recordes exatos de atividades completas e resultados oficiais informados por você.",
  "No current records to show.": "Nenhum recorde atual para mostrar.",
  Period: "Período",
  "Records and reported load": "Recordes e carga informada",
  "Records and reported training load are current.":
    "Os recordes e a carga de treino informada estão atualizados.",
  "Start date": "Data inicial",
  "Start date must be on or before the end date.":
    "A data inicial deve ser igual ou anterior à data final.",
  "This week": "Esta semana",
  "Updating records and reported load": "Atualizando recordes e carga informada",
  Week: "Semana",
  "Your next workout is scheduled later.": "Seu próximo treino está programado para mais tarde.",
  "We couldn't load this week's plan.": "Não foi possível carregar o plano desta semana.",
  "We couldn't open this runner view.": "Não foi possível abrir esta área do corredor.",
  "Loading activity history, progress, and saved plans.":
    "Carregando histórico de atividades, progresso e planos salvos.",
  Steady: "Constante",
  "Date unavailable": "Data indisponível",
  Date: "Data",
  "Not available": "Não disponível",
  run: "corrida",
  runs: "corridas",
  "bpm average": "bpm de média",
  "Complete evidence": "Evidência completa",
  "Partial evidence": "Evidência parcial",
  Unavailable: "Indisponível",
  "No recorded activities in this period": "Nenhuma atividade registrada neste período",
  "Distance was not recorded": "A distância não foi registrada",
  "Timer duration was not recorded": "A duração do cronômetro não foi registrada",
  "Elevation gain was not recorded": "O ganho de elevação não foi registrado",
  "Historical activity date was unavailable": "A data histórica da atividade não estava disponível",
  "Current activity evidence was unavailable":
    "A evidência atual da atividade não estava disponível",
  "Session effort was not reported": "O esforço da sessão não foi informado",
  "Reported effort was outside the accepted 1-10 range":
    "O esforço informado estava fora da faixa aceita de 1 a 10",
  "Observed activity duration was unavailable":
    "A duração observada da atividade não estava disponível",
  "Reported effort was not linked to this recorded activity":
    "O esforço informado não estava vinculado a esta atividade registrada",
  "Reported effort could not be linked to one recorded activity":
    "O esforço informado não pôde ser vinculado a uma única atividade registrada",
  "The recorded outcome is not eligible for session load":
    "O resultado registrado não é elegível para carga da sessão",
  "Skipped workouts do not have session load": "Treinos pulados não têm carga da sessão",
  "The supporting activity evidence changed": "A evidência de atividade de suporte mudou",
  "The supporting activity was corrected": "A atividade de suporte foi corrigida",
  "No current runner-confirmed official result":
    "Nenhum resultado oficial atual confirmado pelo corredor",
  "Detailed workout samples are not available yet":
    "As amostras detalhadas do treino ainda não estão disponíveis",
  "This record class is not supported yet": "Esta classe de recorde ainda não é compatível",
  "The metric is being recalculated": "A métrica está sendo recalculada",
  "Required activity evidence is not available":
    "A evidência de atividade necessária não está disponível",
  "Half marathon": "Meia maratona",
  Marathon: "Maratona",
  mile: "milha",
  miles: "milhas",
  "Official result entered by you": "Resultado oficial informado por você",
  "Hito-observed whole activity": "Atividade completa observada pela Hito",
  "Not available for this period": "Não disponível para este período",
  "Current 28 days": "28 dias atuais",
  "Previous 28 days": "28 dias anteriores",
  "Weekly reported load": "Carga semanal informada",
  "Loading running progress": "Carregando progresso de corrida",
  "Loading factual progress.": "Carregando progresso factual.",
  "Not enough recorded activity": "Atividades registradas insuficientes",
  "Could not load running progress": "Não foi possível carregar o progresso de corrida",
  "Reported training load": "Carga de treino informada",
  "Based on observed activity duration and the whole-session effort you reported.":
    "Com base na duração observada da atividade e no esforço da sessão completa informado por você.",
  "Formula {version}": "Fórmula {version}",
  "{included} included · {unavailable} unavailable":
    "{included} incluídas · {unavailable} indisponíveis",
  "Detailed progress metrics are not available yet.":
    "As métricas detalhadas de progresso ainda não estão disponíveis.",
  "Hito does not yet store the detailed workout samples needed to calculate best efforts inside longer runs or compare pace, heart rate, aerobic efficiency, and durability.":
    "A Hito ainda não armazena as amostras detalhadas de treino necessárias para calcular os melhores esforços em corridas longas ou comparar ritmo, frequência cardíaca, eficiência aeróbica e resistência.",
  "{included} included · {missing} missing · Formula {version}":
    "{included} incluídas · {missing} ausentes · Fórmula {version}",
  "Progress facts will appear after recorded runs.":
    "Os dados de progresso aparecerão após corridas registradas.",
  "Hito will show only facts supported by your activity evidence.":
    "A Hito mostrará apenas dados sustentados pelas evidências das suas atividades.",
  "Calendar view": "Visualização do Calendário",
  Month: "Mês",
  "Previous calendar period": "Período anterior do Calendário",
  "Next calendar period": "Próximo período do Calendário",
  Mon: "Seg",
  Tue: "Ter",
  Wed: "Qua",
  Thu: "Qui",
  Fri: "Sex",
  Sat: "Sáb",
  Sun: "Dom",
  Monday: "Segunda-feira",
  Tuesday: "Terça-feira",
  Wednesday: "Quarta-feira",
  Thursday: "Quinta-feira",
  Friday: "Sexta-feira",
  Saturday: "Sábado",
  Sunday: "Domingo",
  "Future training blueprint": "Estrutura futura de treino",
  "These are provisional intentions, not confirmed Calendar workouts. Details will be reviewed closer to the date.":
    "Estas são intenções provisórias, não treinos confirmados no Calendário. Os detalhes serão revisados mais perto da data.",
  "Future Blueprint projections": "Projeções futuras da estrutura",
  "Planned · details closer to the date": "Planejado · detalhes mais perto da data",
  "Check-in needed": "Check-in necessário",
  "Evidence incomplete": "Evidência incompleta",
  "Ready for review": "Pronto para revisão",
  "Awaiting runner confirmation": "Aguardando confirmação do corredor",
  "{count} sessions per week": "{count} sessões por semana",
  Moving: "Movendo",
  "Undo move for {title}. {seconds} seconds remaining.":
    "Desfazer movimentação de {title}. {seconds} segundos restantes.",
  "Add workout": "Adicionar treino",
  Move: "Mover",
  "Drag to move selected workout": "Arraste para mover o treino selecionado",
  "{label}. Open workout feedback.": "{label}. Abrir feedback do treino.",
  "More activity actions for {title}": "Mais ações para {title}",
  Replace: "Substituir",
  "Review replacement for selected workout": "Revisar substituição do treino selecionado",
  "Move selected workout to rest day": "Mover o treino selecionado para o dia de descanso",
  "Undo {seconds}": "Desfazer {seconds}",
  "Undo move. {seconds} seconds remaining.": "Desfazer movimentação. Restam {seconds} segundos.",
  "{date}. Add workout.": "{date}. Adicionar treino.",
  "{date}. Review replacement for selected workout.":
    "{date}. Revisar substituição do treino selecionado.",
  "{date}. Move selected workout to rest day.":
    "{date}. Mover o treino selecionado para o dia de descanso.",
  Status: "Status",
  Completed: "Concluído",
  Partial: "Parcial",
  Skipped: "Pulado",
  Planned: "Planejado",
  Evidence: "Evidência",
  "Evidence attached": "Evidência anexada",
  Feedback: "Feedback",
  "Feedback ready": "Feedback pronto",
  Easy: "Leve",
  Quality: "Qualidade",
  Intervals: "Intervalos",
  Hills: "Subidas",
  "Long Run": "Corrida longa",
  "Steady or easy": "Constante ou leve",
  "Create a plan": "Criar um plano",
  "Build myself": "Montar por conta própria",
  "Choose how to start training.": "Escolha como começar a treinar.",
  "Add the basics once, then choose a training distance or open an empty manual calendar.":
    "Adicione os dados básicos uma vez e depois escolha uma distância de treino ou abra um calendário manual vazio.",
  "Training setup method": "Método de configuração do treino",
  "Save your runner baseline and accept the BPM guidance before Hito prepares a reviewed plan.":
    "Salve sua linha de base de corredor e aceite a orientação de BPM antes que a Hito prepare um plano revisado.",
  "Advanced settings": "Configurações avançadas",
  "Create workouts independently, or use a workout from a coach or friend.":
    "Crie treinos de forma independente ou use um treino de um treinador ou amigo.",
  "Clear plan": "Limpar plano",
  "Review plan": "Revisar plano",
  "Create plan": "Criar plano",
  "Your saved runner baseline is ready. Your Calendar will open without adding workouts.":
    "Sua linha de base de corredor está pronta. O Calendário será aberto sem adicionar treinos.",
  "Opening manual calendar...": "Abrindo o calendário manual...",
  "Open Calendar": "Abrir Calendário",
  "Check the highlighted BPM ranges before creating this plan.":
    "Verifique as faixas de BPM destacadas antes de criar este plano.",
  "Refresh the saved preview before adding its workouts to Calendar.":
    "Atualize a prévia salva antes de adicionar os treinos ao Calendário.",
  "Adding workouts to Calendar": "Adicionando treinos ao Calendário",
  "Hito is adding this saved plan's workouts to Calendar.":
    "A Hito está adicionando os treinos deste plano salvo ao Calendário.",
  "Calendar not updated": "Calendário não atualizado",
  "Calendar workouts added": "Treinos adicionados ao Calendário",
  "Opening Calendar now.": "Abrindo o Calendário agora.",
  "Could not create this plan.": "Não foi possível criar este plano.",
  "Check the highlighted BPM ranges before starting training.":
    "Verifique as faixas de BPM destacadas antes de começar a treinar.",
  "Opening Calendar": "Abrindo o Calendário",
  "Hito is opening an empty Calendar for manual building.":
    "A Hito está abrindo um Calendário vazio para criação manual.",
  "Calendar not opened": "Calendário não aberto",
  "Calendar ready": "Calendário pronto",
  "Opening your Calendar now.": "Abrindo seu Calendário agora.",
  "The Calendar could not be opened.": "Não foi possível abrir o Calendário.",
  "Add age, height, and weight before creating a plan.":
    "Adicione idade, altura e peso antes de criar um plano.",
  "Save your runner baseline and accept the BPM guidance before creating a plan.":
    "Salve sua linha de base de corredor e aceite a orientação de BPM antes de criar um plano.",
  "Building a reviewed preview. Successful previews are saved in Plans.":
    "Preparando uma prévia revisada. Prévias concluídas são salvas em Planos.",
  "Review the saved plan, then add its workouts to Calendar.":
    "Revise o plano salvo e depois adicione seus treinos ao Calendário.",
  "Saved plan ready for review. Calendar workouts have not been added.":
    "Plano salvo pronto para revisão. Os treinos ainda não foram adicionados ao Calendário.",
  "Choose a goal to build a reviewed preview.":
    "Escolha uma meta para preparar uma prévia revisada.",
  "A successful reviewed preview is saved in Plans before Calendar workouts are added.":
    "Uma prévia revisada concluída é salva em Planos antes que os treinos sejam adicionados ao Calendário.",
  "Add age, height, and weight before opening Calendar.":
    "Adicione idade, altura e peso antes de abrir o Calendário.",
  "A compact goal for building rhythm and confidence.":
    "Uma meta compacta para desenvolver ritmo e confiança.",
  "Half Marathon": "Meia maratona",
  "A longer build with steady endurance and quality work.":
    "Uma preparação mais longa com resistência constante e trabalho de qualidade.",
  "A full marathon goal with reviewed load and long-run progression.":
    "Uma meta de maratona completa com carga revisada e progressão de corridas longas.",
  "Set your own distance and use the same generated-plan review path.":
    "Defina sua própria distância e use o mesmo fluxo de revisão do plano gerado.",
  Generated: "Gerado",
  "Choose your goal.": "Escolha sua meta.",
  "Pick one goal. A successful reviewed preview is saved in Plans before its workouts are added to Calendar.":
    "Escolha uma meta. Uma prévia revisada concluída é salva em Planos antes que seus treinos sejam adicionados ao Calendário.",
  "Plan context (optional)": "Contexto do plano (opcional)",
  "For example, I ran an even 8K yesterday and recovered well.":
    "Por exemplo, corri 8 km em ritmo constante ontem e me recuperei bem.",
  "Add a few basics before previewing": "Adicione alguns dados básicos antes da prévia",
  "Age, height, and weight are required before Hito can prepare a reviewed plan.":
    "Idade, altura e peso são obrigatórios para a Hito preparar um plano revisado.",
  "Training goal": "Meta de treino",
  "Custom distance": "Distância personalizada",
  "Kilometers. For example: 12.5.": "Quilômetros. Por exemplo: 12,5.",
  "Goal name": "Nome da meta",
  "Optional. For example: City 12.5K.": "Opcional. Por exemplo: Corrida da Cidade 12,5K.",
  "Race day": "Dia da prova",
  "Required. Choose the race day for this generated plan.":
    "Obrigatório. Escolha o dia da prova deste plano gerado.",
  "Finish time": "Tempo final",
  "Optional. Add this only if you have a result goal.":
    "Opcional. Adicione somente se tiver uma meta de resultado.",
  "That means about {pace} on race day.": "Isso significa cerca de {pace} no dia da prova.",
  "This is goal readback, not your workout pace target.":
    "Esta é uma leitura da meta, não o ritmo-alvo dos seus treinos.",
  "Runner baseline": "Linha de base do corredor",
  "Add the few facts Hito needs before training setup.":
    "Adicione os poucos dados que a Hito precisa antes da configuração do treino.",
  "Complete your runner baseline": "Complete seus dados básicos de corredor",
  "Estimated BPM guidance appears automatically when the required profile facts are valid. The estimate itself is age-based.":
    "A orientação estimada de BPM aparece automaticamente quando os dados obrigatórios do perfil são válidos. A estimativa é baseada na idade.",
  "Plan preparation request cancelled": "Solicitação de preparação do plano cancelada",
  "Plan preparation request cancelled. Nothing was created or saved.":
    "Solicitação de preparação do plano cancelada. Nada foi criado ou salvo.",
  "Add an age from 13 to 100.": "Adicione uma idade de 13 a 100 anos.",
  "Add a height from 120 to 230 cm.": "Adicione uma altura de 120 a 230 cm.",
  "Add a weight from 30 to 250 kg.": "Adicione um peso de 30 a 250 kg.",
  "Review the optional plan context.": "Revise o contexto opcional do plano.",
  "Add your target date.": "Adicione a data da sua meta.",
  "Choose a training goal.": "Escolha uma meta de treinamento.",
  "Add a custom distance greater than 0 and up to 500 km.":
    "Adicione uma distância personalizada maior que 0 e de até 500 km.",
  "Use a positive finish time such as 45:00 or 3:50:00.":
    "Use um tempo final positivo, como 45:00 ou 3:50:00.",
  "Use a real target date.": "Use uma data de meta válida.",
  "Enter a distance greater than 0 and up to 500 km.":
    "Informe uma distância maior que 0 e de até 500 km.",
  "Add a valid age, height, weight, and running level first.":
    "Primeiro adicione idade, altura, peso e nível de corrida válidos.",
  "The saved BPM guidance could not be accepted. Review the ranges and try again.":
    "A orientação de BPM salva não pôde ser aceita. Revise as faixas e tente novamente.",
  "Heart-rate guidance could not be saved. Check the highlighted BPM ranges.":
    "Não foi possível salvar a orientação de frequência cardíaca. Verifique as faixas de BPM destacadas.",
  "Your runner baseline could not be saved.":
    "Não foi possível salvar seus dados básicos de corredor.",
  "Check the highlighted BPM ranges before continuing.":
    "Verifique as faixas de BPM destacadas antes de continuar.",
  "{goal} preview ready": "Prévia de {goal} pronta",
  "Hito could not prepare the plan right now. Nothing was created or saved. Try again.":
    "A Hito não conseguiu preparar o plano agora. Nada foi criado ou salvo. Tente novamente.",
  "Checking the calendar for room to breathe.":
    "Verificando se há espaço para respirar no calendário.",
  "Consulting an imaginary committee about comfortable socks.":
    "Consultando um comitê imaginário sobre meias confortáveis.",
  "Definitely not calling your friends for pace advice.":
    "Definitivamente sem ligar para seus amigos pedindo conselhos de ritmo.",
  "Making sure the long run gets the good socks.":
    "Garantindo que a corrida longa fique com as meias boas.",
  "Plan preview ready": "Prévia do plano pronta",
  "Plan preview ready for review.": "Prévia do plano pronta para revisão.",
  "Preparing your {goal} plan.": "Preparando seu plano de {goal}.",
  Age: "Idade",
  Height: "Altura",
  Weight: "Peso",
  "Running level": "Nível de corrida",
  "Choose the closest current rhythm.": "Escolha o ritmo atual mais próximo.",
  "Heart-rate guidance": "Orientação de frequência cardíaca",
  "Review the BPM ranges Hito can use when a workout calls for heart-rate guidance.":
    "Revise as faixas de BPM que a Hito pode usar quando um treino pedir orientação de frequência cardíaca.",
  "Add optional benchmark and weekly availability.":
    "Adicione um parâmetro opcional e sua disponibilidade semanal.",
  "No recent 5K": "Nenhum 5K recente",
  "Add 5K result": "Adicionar resultado de 5K",
  "Weekly running ceiling": "Limite semanal de corrida",
  "Optional. Choose the most days you want to run in a week, or keep it flexible.":
    "Opcional. Escolha o máximo de dias que deseja correr por semana ou mantenha flexível.",
  "Schedule rhythm": "Ritmo da agenda",
  "Add simple day preferences when you already know them.":
    "Adicione preferências simples de dias quando já souber quais são.",
  "Optional. Protect days you want to keep free.":
    "Opcional. Proteja os dias que deseja manter livres.",
  "Optional. Leave this open if you do not have a preferred day.":
    "Opcional. Deixe em aberto se não tiver um dia preferido.",
  "Plan Start Date": "Data de início do plano",
  "Optional. Leave this open to use Hito's default start date.":
    "Opcional. Deixe em aberto para usar a data de início padrão da Hito.",
  "Fixed rest days": "Dias fixos de descanso",
  "Optional. Choose only weekdays that must stay free.":
    "Opcional. Escolha apenas os dias da semana que precisam ficar livres.",
  "Choose weekdays that must stay free in this schedule.":
    "Escolha os dias da semana que precisam ficar livres nesta agenda.",
  Flexible: "Flexível",
  "No fixed rest days": "Nenhum dia fixo de descanso",
  "{day} fixed rest day": "{day}, dia fixo de descanso",
  "Preferred long-run day": "Dia preferido para corrida longa",
  "Leave unselected to keep Sunday as the default.":
    "Deixe sem seleção para manter domingo como padrão.",
  "Optional. Leave open if any available day is fine.":
    "Opcional. Deixe em aberto se qualquer dia disponível servir.",
  "Use default": "Usar padrão",
  Any: "Qualquer",
  "Fitness benchmark": "Referência de condicionamento",
  "Running days per week": "Dias de corrida por semana",
  "Optional. This is a maximum, not a target workout count.":
    "Opcional. Este é um máximo, não uma meta de quantidade de treinos.",
  "Choose 1-{count} running days per week.": "Escolha de 1 a {count} dias de corrida por semana.",
  "Up to {count} running day per week": "Até {count} dia de corrida por semana",
  "Up to {count} running days per week": "Até {count} dias de corrida por semana",
  "{count} running day per week": "{count} dia de corrida por semana",
  "{count} running days per week": "{count} dias de corrida por semana",
  "Use a positive recent 5K time such as 25:00.":
    "Use um tempo positivo de 5K recente, como 25:00.",
  "Use a positive recent 5K pace such as 5:00/km.":
    "Use um ritmo positivo de 5K recente, como 5:00/km.",
  "Use a recent 5K time or pace.": "Use um tempo ou ritmo de 5K recente.",
  "Optional. Add either value to help Hito choose useful pace guidance.":
    "Opcional. Adicione um dos valores para ajudar a Hito a escolher uma orientação de ritmo útil.",
  "Recent 5K time": "Tempo recente de 5K",
  "Recent 5K pace": "Ritmo recente de 5K",
  "New to running": "Começando a correr",
  "Neutral running": "Corrida neutra",
  Beginner: "Iniciante",
  Beginning: "Começando",
  "Running regularly": "Correndo regularmente",
  "Performance focused": "Foco em desempenho",
  "I know my recent 5K": "Sei meu 5K recente",
  "Start gently and build the habit first.": "Comece com calma e crie o hábito primeiro.",
  "You run sometimes and want a steady base.": "Você corre às vezes e quer uma base constante.",
  "You already run most weeks.": "Você já corre na maioria das semanas.",
  "You can handle more structured quality work.":
    "Você consegue lidar com um trabalho de qualidade mais estruturado.",
  "Use a recent 5K time or pace when you have one.":
    "Use um tempo ou ritmo de 5K recente quando tiver um.",
  "Review the saved plan before adding its workouts to Calendar.":
    "Revise o plano salvo antes de adicionar seus treinos ao Calendário.",
  "Add to Calendar": "Adicionar ao Calendário",
  "Adding to Calendar...": "Adicionando ao Calendário...",
  "Preparing your {goal} plan": "Preparando seu plano de {goal}",
  "Plan preview preparation is in progress.": "A preparação da prévia do plano está em andamento.",
  "Generated plan": "Plano gerado",
  "{goal} plan preview": "Prévia do plano de {goal}",
  "Preview unavailable": "Prévia indisponível",
  "Refreshing preview": "Atualizando prévia",
  "Your current saved plan stays in Plans while Hito prepares a new reviewed version.":
    "Seu plano salvo atual permanece em Planos enquanto a Hito prepara uma nova versão revisada.",
  Close: "Fechar",
  "Saved in Plans. Calendar workouts have not been added yet.":
    "Salvo em Planos. Os treinos ainda não foram adicionados ao Calendário.",
  "Review details": "Revisar detalhes",
  "Back to calendar": "Voltar ao calendário",
  "Active plan already exists": "Já existe um plano ativo",
  "Selected plans can create a new plan only when there is no active plan.":
    "Planos selecionados só podem criar um novo plano quando não há um plano ativo.",
  "Preview session unavailable": "Sessão de prévia indisponível",
  "This local preview session can no longer add the saved plan to Calendar. The saved record remains in Plans.":
    "Esta sessão local de prévia não pode mais adicionar o plano salvo ao Calendário. O registro salvo permanece em Planos.",
  "Refresh this preview": "Atualize esta prévia",
  "This saved preview is no longer current. Refresh it before adding workouts to Calendar.":
    "Esta prévia salva não está mais atual. Atualize-a antes de adicionar treinos ao Calendário.",
  "Sign in before adding to Calendar": "Entre antes de adicionar ao Calendário",
  "This session cannot add the saved plan to Calendar yet. The saved record remains in Plans.":
    "Esta sessão ainda não pode adicionar o plano salvo ao Calendário. O registro salvo permanece em Planos.",
  "Calendar was not updated": "O Calendário não foi atualizado",
  "Hito could not add the saved plan to Calendar. The saved record remains in Plans.":
    "A Hito não conseguiu adicionar o plano salvo ao Calendário. O registro salvo permanece em Planos.",
  "Next step": "Próximo passo",
  "Nothing was created or saved.": "Nada foi criado ou salvo.",
  "Check the plan details": "Verifique os detalhes do plano",
  "Some required plan details are missing or invalid, so Hito could not prepare a preview.":
    "Alguns detalhes obrigatórios do plano estão ausentes ou inválidos, então a Hito não pôde preparar uma prévia.",
  "Review the plan details and try again.": "Revise os detalhes do plano e tente novamente.",
  "Plan preview is temporarily unavailable": "A prévia do plano está temporariamente indisponível",
  "Hito could not prepare the plan right now. Your goal details do not need to change.":
    "A Hito não conseguiu preparar o plano agora. Os detalhes da sua meta não precisam mudar.",
  "Try again in a moment.": "Tente novamente em instantes.",
  "The plan preview was incomplete": "A prévia do plano ficou incompleta",
  "Hito could not prepare a complete plan for review. Your goal details do not need to change.":
    "A Hito não conseguiu preparar um plano completo para revisão. Os detalhes da sua meta não precisam mudar.",
  "Try preparing the plan again.": "Tente preparar o plano novamente.",
  "The plan preview could not be prepared": "Não foi possível preparar a prévia do plano",
  "Hito could not turn this attempt into a complete plan for review. Your goal details do not need to change.":
    "A Hito não conseguiu transformar esta tentativa em um plano completo para revisão. Os detalhes da sua meta não precisam mudar.",
  "The plan review is unavailable": "A revisão do plano está indisponível",
  "Hito could not prepare this plan for confirmation. Your goal details do not need to change.":
    "A Hito não conseguiu preparar este plano para confirmação. Os detalhes da sua meta não precisam mudar.",
  "Refresh the preview and try again.": "Atualize a prévia e tente novamente.",
  "Workout preview unavailable": "Prévia do treino indisponível",
  "The reviewed workout document for {date} is unavailable. Refresh this preview before creating the plan.":
    "O documento de treino revisado para {date} está indisponível. Atualize esta prévia antes de criar o plano.",
  "Plan calendar": "Calendário do plano",
  "Select a day to review the workout summary.":
    "Selecione um dia para revisar o resumo do treino.",
  "Week {week}": "Semana {week}",
  "Open workout summary": "Abrir resumo do treino",
  "{date} workout summary": "Resumo do treino de {date}",
  "Calendar legend": "Legenda do Calendário",
  "{goal} plan": "Plano de {goal}",
  "Starts {date}": "Começa em {date}",
  "{weeks} weeks · Ends on race day, {date}": "{weeks} semanas · Termina no dia da prova, {date}",
  "{weeks} weeks · Ends {date}": "{weeks} semanas · Termina em {date}",
  "Race day {date}": "Dia da prova: {date}",
  "Target finish {time}": "Tempo-alvo: {time}",
  "{count} block": "{count} bloco",
  "{count} blocks": "{count} blocos",
  "{count}-block workout structure schematic": "Esquema da estrutura do treino com {count} blocos",
  "Generated plans ready for review could not be loaded.":
    "Não foi possível carregar os planos gerados prontos para revisão.",
  "We could not load saved plans. Try again shortly.":
    "Não foi possível carregar os planos salvos. Tente novamente em instantes.",
  Visibility: "Visibilidade",
  Hidden: "Oculto",
  "All records": "Todos os registros",
  "The action succeeded, but the latest Calendar summary could not be refreshed.":
    "A ação foi concluída, mas não foi possível atualizar o resumo mais recente do Calendário.",
  "The saved plan was not started and Calendar was not changed.":
    "O plano salvo não foi iniciado e o Calendário não foi alterado.",
  "We could not start this saved plan.": "Não foi possível iniciar este plano salvo.",
  "We could not replace future workouts.": "Não foi possível substituir os treinos futuros.",
  "We could not hide this saved plan.": "Não foi possível ocultar este plano salvo.",
  "We could not restore this generated plan review.":
    "Não foi possível restaurar a revisão deste plano gerado.",
  "Could not load saved plans": "Não foi possível carregar os planos salvos",
  "Saved plans": "Planos salvos",
  "Plan library": "Biblioteca de planos",
  "Saved plans are immutable records. Legacy records can start ordinary future Calendar workouts, while generated plans reopen the required Review and Confirm step first.":
    "Planos salvos são registros imutáveis. Registros legados podem iniciar treinos futuros comuns no Calendário, enquanto planos gerados reabrem primeiro as etapas obrigatórias de Revisão e Confirmação.",
  "Checking the future Calendar…": "Verificando o Calendário futuro…",
  "Hiding saved plan…": "Ocultando plano salvo…",
  "Restoring generated plan review…": "Restaurando revisão do plano gerado…",
  "Adding reviewed workouts to Calendar…": "Adicionando treinos revisados ao Calendário…",
  Available: "Disponível",
  "Filter saved plans by visibility": "Filtrar planos salvos por visibilidade",
  Filters: "Filtros",
  "Active filters": "Filtros ativos",
  "Clear all": "Limpar tudo",
  "Clear saved plan search": "Limpar busca de planos salvos",
  "Search saved plans by name": "Pesquisar planos salvos por nome",
  "Search plan names": "Pesquisar nomes de planos",
  Plan: "Plano",
  "Sort saved plans by name": "Ordenar planos salvos por nome",
  "Name A to Z": "Nome de A a Z",
  Created: "Criado",
  "Sort saved plans by created date": "Ordenar planos salvos por data de criação",
  "Newest first": "Mais recentes primeiro",
  "Oldest first": "Mais antigos primeiro",
  Schedule: "Agenda",
  Workouts: "Treinos",
  "Sort saved plans by workout count": "Ordenar planos salvos por quantidade de treinos",
  "Most workouts first": "Mais treinos primeiro",
  State: "Estado",
  "Saved plan library with factual summaries and selected-record actions.":
    "Biblioteca de planos salvos com resumos factuais e ações dos registros selecionados.",
  "Start was canceled. Calendar was not changed.":
    "O início foi cancelado. O Calendário não foi alterado.",
  "Review the restored saved plan before adding its workouts to Calendar.":
    "Revise o plano salvo restaurado antes de adicionar seus treinos ao Calendário.",
  "Open actions for {title}": "Abrir ações de {title}",
  "Download JSON": "Baixar JSON",
  "Start plan": "Iniciar plano",
  "Hide from library": "Ocultar da biblioteca",
  Review: "Revisão",
  "Restore plan": "Restaurar plano",
  Expired: "Expirado",
  Stale: "Desatualizado",
  "Fresh review ready": "Nova revisão pronta",
  "Hito rebuilt this review from the saved candidate and current runner facts. Confirming is still required before Calendar changes.":
    "A Hito refez esta revisão a partir do candidato salvo e dos dados atuais do corredor. A confirmação ainda é obrigatória antes de alterar o Calendário.",
  "Previously confirmed review": "Revisão confirmada anteriormente",
  "This saved review has already been confirmed. It remains available for reference, but it cannot be confirmed again.":
    "Esta revisão salva já foi confirmada. Ela permanece disponível para consulta, mas não pode ser confirmada novamente.",
  "Runner facts have changed since this plan was prepared.":
    "Os dados do corredor mudaram desde que este plano foi preparado.",
  "The saved candidate lineage is no longer valid for confirmation.":
    "A linhagem do candidato salvo não é mais válida para confirmação.",
  "The saved candidate no longer passes the current plan contract.":
    "O candidato salvo não atende mais ao contrato atual do plano.",
  "Read-only saved review": "Revisão salva somente para leitura",
  "Review remains available, but Confirm is disabled.":
    "A revisão permanece disponível, mas Confirmar está desativado.",
  "target {date}": "meta {date}",
  "finish {time}": "final {time}",
  "Replace future workouts?": "Substituir treinos futuros?",
  "Hide this saved plan?": "Ocultar este plano salvo?",
  "This hides only the immutable library record from the ordinary view. Calendar workouts and history remain unchanged.":
    "Isso oculta apenas o registro imutável da visualização comum da biblioteca. Os treinos do Calendário e o histórico permanecem inalterados.",
  "Replace future workouts": "Substituir treinos futuros",
  "Hide plan": "Ocultar plano",
  "Plan started": "Plano iniciado",
  "No existing future workouts needed replacement.":
    "Nenhum treino futuro existente precisou ser substituído.",
  "The saved record stayed unchanged; the new Calendar workouts are independently editable.":
    "O registro salvo permaneceu inalterado; os novos treinos do Calendário podem ser editados de forma independente.",
  "No matching plans": "Nenhum plano correspondente",
  "No saved plans": "Nenhum plano salvo",
  "No plans match this library view.":
    "Nenhum plano corresponde a esta visualização da biblioteca.",
  "Your saved plan library is empty.": "Sua biblioteca de planos salvos está vazia.",
  "Clear the name search or change the visibility filter.":
    "Limpe a pesquisa por nome ou altere o filtro de visibilidade.",
  "Change the visibility filter to review other saved records.":
    "Altere o filtro de visibilidade para revisar outros registros salvos.",
  "Successfully saved running plans will appear here as immutable records.":
    "Planos de corrida salvos com sucesso aparecerão aqui como registros imutáveis.",
  "Loading saved plans": "Carregando planos salvos",
  plan: "plano",
  plans: "planos",
  "{count} future workout already exists. Only a positive replacement will start this plan; past and protected history are not replaceable here.":
    "Já existe {count} treino futuro. Somente uma confirmação positiva de substituição iniciará este plano; o histórico passado e protegido não pode ser substituído aqui.",
  "{count} future workouts already exist. Only a positive replacement will start this plan; past and protected history are not replaceable here.":
    "Já existem {count} treinos futuros. Somente uma confirmação positiva de substituição iniciará este plano; o histórico passado e protegido não pode ser substituído aqui.",
  "Starts {date} with {workouts} non-Rest workouts across {days} Calendar days.":
    "Começa em {date} com {workouts} treinos que não são de descanso ao longo de {days} dias do Calendário.",
  "{count} leading source days were omitted by schedule alignment.":
    "{count} dias iniciais da fonte foram omitidos pelo alinhamento da agenda.",
  "{count} eligible future workouts were replaced.":
    "{count} treinos futuros elegíveis foram substituídos.",
  "{title} was started from its saved record.": "{title} foi iniciado a partir do registro salvo.",
  "{title} is hidden from the ordinary library view.":
    "{title} está oculto na visualização comum da biblioteca.",
  "Check the highlighted BPM ranges before saving personal data.":
    "Verifique as faixas de BPM destacadas antes de salvar os dados pessoais.",
  "Personal data saved.": "Dados pessoais salvos.",
  "User settings could not be saved.": "Não foi possível salvar as configurações do usuário.",
  "Training preferences saved.": "Preferências de treino salvas.",
  "Training preferences could not be saved.": "Não foi possível salvar as preferências de treino.",
  "Sign in first": "Entre primeiro",
  "User settings open after sign-in.": "As configurações do usuário ficam disponíveis após entrar.",
  "Save a profile first, then you can manage your avatar, body data, and future heart rate settings here.":
    "Salve primeiro um perfil para depois gerenciar aqui seu avatar, dados corporais e futuras configurações de frequência cardíaca.",
  "Finish setup first": "Conclua a configuração primeiro",
  "User settings need a saved runner profile.":
    "As configurações do usuário precisam de um perfil de corredor salvo.",
  "Complete setup on home first, then this page can store your profile details.":
    "Conclua primeiro a configuração na página inicial para que esta página possa armazenar os detalhes do seu perfil.",
  "Back to home": "Voltar ao início",
  "User settings": "Configurações do usuário",
  "Profile details that follow your training.": "Detalhes do perfil que acompanham seu treino.",
  "Keep your personal data and future-plan training defaults in one place. Settings update your runner profile, not existing Calendar workouts.":
    "Mantenha seus dados pessoais e padrões de treino para planos futuros em um só lugar. As configurações atualizam seu perfil de corredor, não os treinos existentes no Calendário.",
  "Uploading avatar": "Enviando avatar",
  "Saving settings": "Salvando configurações",
  Ready: "Pronto",
  "These settings update your saved runner profile only.":
    "Estas configurações atualizam somente seu perfil de corredor salvo.",
  "Settings section": "Seção de configurações",
  "Personal data": "Dados pessoais",
  "Training preferences": "Preferências de treino",
  Appearance: "Aparência",
  "Profile avatar": "Avatar do perfil",
  "Uploading...": "Enviando...",
  Edit: "Editar",
  Upload: "Enviar",
  "The avatar could not be uploaded.": "Não foi possível enviar o avatar.",
  "Choose an avatar image before uploading.": "Escolha uma imagem de avatar antes de enviar.",
  "Choose a non-empty avatar image.": "Escolha uma imagem de avatar que não esteja vazia.",
  "Choose an avatar image under {maxSizeMb} MB.":
    "Escolha uma imagem de avatar com menos de {maxSizeMb} MB.",
  "Use one of these avatar file types: {allowedMimeTypes}.":
    "Use um destes tipos de arquivo para o avatar: {allowedMimeTypes}.",
  "Finish setup before uploading an avatar.": "Conclua a configuração antes de enviar um avatar.",
  "Sign in again before changing your avatar.": "Entre novamente antes de alterar seu avatar.",
  "The avatar could not be uploaded. Try again shortly.":
    "Não foi possível enviar o avatar. Tente novamente em instantes.",
  "The source image could not be prepared. Choose another JPEG, PNG, or WebP image.":
    "Não foi possível preparar a imagem de origem. Escolha outra imagem JPEG, PNG ou WebP.",
  "Avatar updated.": "Avatar atualizado.",
  Identity: "Identidade",
  "First name": "Nome",
  "Last name": "Sobrenome",
  "Display name": "Nome de exibição",
  Email: "E-mail",
  "No saved email": "Nenhum e-mail salvo",
  "Body data": "Dados corporais",
  "The same compact profile facts used during runner setup.":
    "Os mesmos dados compactos de perfil usados na configuração do corredor.",
  "Saving...": "Salvando...",
  "Save personal data": "Salvar dados pessoais",
  "Defaults for future plan creation. They prefill setup but never rewrite existing Calendar workouts.":
    "Padrões para a criação de planos futuros. Eles preenchem a configuração, mas nunca reescrevem treinos existentes no Calendário.",
  "Recent 5K details are added per plan. Settings can preserve an existing custom level or switch to a standard level.":
    "Os detalhes de 5K recente são adicionados por plano. As configurações podem preservar um nível personalizado existente ou mudar para um nível padrão.",
  "Optional. Choose only weekdays Hito must keep clear in future plans.":
    "Opcional. Escolha somente os dias da semana que a Hito deve manter livres em planos futuros.",
  "Optional. This is an upper ceiling for future plans, not a target workout count.":
    "Opcional. Este é um limite máximo para planos futuros, não uma meta de quantidade de treinos.",
  "Rest days are unavailable here. Leave unselected to keep Sunday as the default.":
    "Dias de descanso não estão disponíveis aqui. Deixe sem seleção para manter domingo como padrão.",
  "Save training preferences": "Salvar preferências de treino",
  Theme: "Tema",
  "Theme preference": "Preferência de tema",
  System: "Sistema",
  Light: "Claro",
  Dark: "Escuro",
  "Follow this device.": "Seguir este dispositivo.",
  "Keep Hito dark.": "Manter a Hito escura.",
  "Use the light palette.": "Usar a paleta clara.",
  "Resolved theme: {theme}.": "Tema aplicado: {theme}.",
  "Choose how Hito resolves the shared semantic color tokens on this device. The preference stays in this browser and does not change your runner profile.":
    "Escolha como a Hito aplica as cores semânticas compartilhadas neste dispositivo. A preferência permanece neste navegador e não altera seu perfil de corredor.",
  "Current theme": "Tema atual",
  "System is active. Hito is currently using {theme}.":
    "O tema do sistema está ativo. A Hito está usando o tema {theme} agora.",
  "{theme} is active.": "O tema {theme} está ativo.",
  "Root attribute": "Atributo raiz",
  "Calendar timezone": "Fuso horário do Calendário",
  "Hito uses this IANA timezone to decide which date is Today and which workouts are past.":
    "A Hito usa este fuso horário IANA para decidir qual data é Hoje e quais treinos já passaram.",
  "IANA timezone": "Fuso horário IANA",
  "Use this device": "Usar este dispositivo",
  "Save timezone": "Salvar fuso horário",
  "Saved timezone": "Fuso horário salvo",
  "This browser could not identify a recognized IANA timezone.":
    "Este navegador não conseguiu identificar um fuso horário IANA reconhecido.",
  "Calendar timezone saved as {timezone}.": "Fuso horário do Calendário salvo como {timezone}.",
  "Chosen explicitly in Settings.": "Escolhido explicitamente nas Configurações.",
  "Initialized from a browser timezone.": "Inicializado a partir do fuso horário do navegador.",
  "UTC recovery fallback; this device can initialize it automatically.":
    "Fallback de recuperação UTC; este dispositivo pode inicializá-lo automaticamente.",
  "Your calendar timezone could not be saved. Choose a recognized city timezone.":
    "Não foi possível salvar o fuso horário do Calendário. Escolha um fuso horário de cidade reconhecido.",
  "Adjust the BPM ranges Hito can use for future plan authoring.":
    "Ajuste as faixas de BPM que a Hito pode usar para criar planos futuros.",
  Recommended: "Recomendado",
  Recovery: "Recuperação",
  "Very easy effort for recovery days and warmups.":
    "Esforço muito leve para dias de recuperação e aquecimentos.",
  "Comfortable aerobic running.": "Corrida aeróbica confortável.",
  "Long aerobic": "Aeróbico longo",
  "Long-run aerobic starting range.": "Faixa aeróbica inicial para corridas longas.",
  "Controlled steady effort.": "Esforço constante controlado.",
  Tempo: "Tempo",
  "Sustained harder effort when a workout asks for it.":
    "Esforço mais intenso sustentado quando o treino pedir.",
  "{zone} lower bound": "Limite inferior de {zone}",
  "{zone} upper bound": "Limite superior de {zone}",
  "Add and save your age first to establish editable starting ranges.":
    "Adicione e salve primeiro sua idade para estabelecer faixas iniciais editáveis.",
  "Upper bound must be at or above lower bound.":
    "O limite superior deve ser igual ou maior que o limite inferior.",
  "This guidance band ends before it starts.": "Esta faixa de orientação termina antes de começar.",
  "Each guidance band must start at or below its end.":
    "Cada faixa de orientação deve começar em um valor igual ou menor que o final.",
  "Keep lower and upper bounds non-decreasing through the guidance order.":
    "Mantenha os limites inferior e superior sem diminuição ao longo da ordem de orientação.",
  "Check all five guidance bands before saving.":
    "Verifique todas as cinco faixas de orientação antes de salvar.",
  "Enter a BPM value.": "Informe um valor de BPM.",
  "Setup required": "Configuração necessária",
  "Finish setup before opening workouts.": "Conclua a configuração antes de abrir os treinos.",
  "Complete your runner setup first, then your workouts will open here.":
    "Conclua primeiro a configuração do corredor para depois abrir seus treinos aqui.",
  "No workout": "Nenhum treino",
  "Nothing is scheduled for this day.": "Nada está programado para este dia.",
  "There is no workout on this date in your Calendar. Go back and choose another day.":
    "Não há treino nesta data no seu Calendário. Volte e escolha outro dia.",
  "Back to Calendar": "Voltar ao Calendário",
  "Workout detail view": "Visualização dos detalhes do treino",
  Result: "Resultado",
  "Future insights": "Insights futuros",
  "There isn't enough data yet to provide these inputs and insights. This is a future feature.":
    "Ainda não há dados suficientes para fornecer estas informações e insights. Este é um recurso futuro.",
  "{completed} of {scheduled} workouts completed": "{completed} de {scheduled} treinos concluídos",
  "Workout unavailable": "Treino indisponível",
  "We couldn't load this workout.": "Não foi possível carregar este treino.",
  "Try again. If setup is still incomplete, go back home first.":
    "Tente novamente. Se a configuração ainda estiver incompleta, volte primeiro ao início.",
  "Open workout actions": "Abrir ações do treino",
  "Workout actions": "Ações do treino",
  "Edit this training": "Editar este treino",
  "Ready when you finish": "Pronto quando você terminar",
  "Not logged yet": "Ainda não registrado",
  "Add a result or activity file after you run it. Both update this Calendar workout.":
    "Adicione um resultado ou arquivo de atividade depois de correr. Ambos atualizam este treino no Calendário.",
  "This past workout is treated as unlogged until you add a real result.":
    "Este treino passado é considerado não registrado até você adicionar um resultado real.",
  "Add result": "Adicionar resultado",
  "Add activity file": "Adicionar arquivo de atividade",
  "Recovery day": "Dia de recuperação",
  "Keep it light.": "Mantenha leve.",
  "No distance, duration, or load is scheduled here. Let the day stay open unless a real recovery assignment is present.":
    "Nenhuma distância, duração ou carga está programada aqui. Mantenha o dia livre, a menos que haja uma atividade real de recuperação.",
  Assignment: "Atividade",
  "No extra workout structure was provided for this workout.":
    "Nenhuma estrutura adicional foi fornecida para este treino.",
  Previous: "Anterior",
  Next: "Próximo",
  "Saving feedback...": "Salvando feedback...",
  "Feedback saved": "Feedback salvo",
  "Save feedback": "Salvar feedback",
  "Preview result": "Prévia do resultado",
  "Saving result...": "Salvando resultado...",
  "Saved result": "Resultado salvo",
  "Save changes": "Salvar alterações",
  "Save result": "Salvar resultado",
  "Rest days do not need a workout result. If a mobility or strength assignment is added later, you can log it here.":
    "Dias de descanso não precisam de um resultado de treino. Se uma atividade de mobilidade ou força for adicionada depois, você poderá registrá-la aqui.",
  "Saving feedback": "Salvando feedback",
  "Saving result": "Salvando resultado",
  "Couldn't save": "Não foi possível salvar",
  "Unsaved changes": "Alterações não salvas",
  Saved: "Salvo",
  "Partial result": "Resultado parcial",
  "Completed from activity file": "Concluído pelo arquivo de atividade",
  "Ready to save": "Pronto para salvar",
  "Saving your personal feedback now.": "Salvando seu feedback pessoal agora.",
  "Saving your {outcome} result now.": "Salvando agora seu resultado {outcome}.",
  "You changed this {outcome} result. Save to update the workout and this week's status.":
    "Você alterou este resultado {outcome}. Salve para atualizar o treino e o status desta semana.",
  "Your recorded activity remains attached. This partial result is your explicit correction.":
    "Sua atividade registrada continua anexada. Este resultado parcial é sua correção explícita.",
  "Your recorded activity completed this workout. Distance, duration, and intervals stay with the activity file.":
    "Sua atividade registrada concluiu este treino. Distância, duração e intervalos permanecem com o arquivo da atividade.",
  "This workout already has a saved {outcome} result. {detail}":
    "Este treino já tem um resultado {outcome} salvo. {detail}",
  "Last updated {date}.": "Última atualização em {date}.",
  "This result is already saved.": "Este resultado já está salvo.",
  "Save this result to update the workout and this week's status.":
    "Salve este resultado para atualizar o treino e o status desta semana.",
  "You can try the form here, but preview results are not saved.":
    "Você pode testar o formulário aqui, mas os resultados da prévia não são salvos.",
  "Partial correction": "Correção parcial",
  "Activity file": "Arquivo de atividade",
  "Changes not saved": "Alterações não salvas",
  "How did it go?": "Como foi?",
  "Workout outcome": "Resultado do treino",
  Complete: "Concluído",
  "Skipped result": "Resultado pulado",
  "A skipped result saves without distance, duration, reps, or RPE. You can still leave a note for context.":
    "Um resultado pulado é salvo sem distância, duração, repetições ou PSE. Você ainda pode deixar uma observação para dar contexto.",
  "Completion correction": "Correção da conclusão",
  "This activity is recorded as partial by your choice.":
    "Esta atividade foi registrada como parcial por sua escolha.",
  "Recorded activity remains completed unless you mark it partial.":
    "A atividade registrada continua concluída, a menos que você a marque como parcial.",
  "Use completed": "Usar concluído",
  "Mark as partial": "Marcar como parcial",
  "Effort (RPE)": "Esforço (PSE)",
  "Restore session effort {value} out of 10": "Restaurar esforço da sessão: {value} de 10",
  "Not recorded": "Não registrado",
  "Effort not recorded": "Esforço não registrado",
  "Effort {value} out of 10": "Esforço {value} de 10",
  Notes: "Observações",
  "Felt strong on the climb, slight tightness in right calf at km 6...":
    "Senti força na subida, com leve tensão na panturrilha direita no km 6...",
  "Felt strong on the climb, slight tightness in right calf at km 6…":
    "Senti força na subida, com leve tensão na panturrilha direita no km 6…",
  "This saves personal feedback. Distance, duration, and intervals remain with the recorded activity.":
    "Isso salva seu feedback pessoal. Distância, duração e intervalos permanecem com a atividade registrada.",
  "Manually add details": "Adicionar detalhes manualmente",
  "Planned vs actual": "Planejado x realizado",
  "Intervals completed": "Intervalos concluídos",
  "Tap to mark how many reps were completed.":
    "Toque para marcar quantas repetições foram concluídas.",
  "This saves your workout result. Garmin uploads live in Feedback.":
    "Isso salva o resultado do seu treino. Os envios da Garmin ficam em Feedback.",
  "Preview only. Results entered here are not saved.":
    "Somente prévia. Os resultados informados aqui não são salvos.",
  "Preview result updated locally. Sign in to save it.":
    "O resultado da prévia foi atualizado localmente. Entre para salvá-lo.",
  "Personal feedback saved. The recorded activity remains the workout result.":
    "Feedback pessoal salvo. A atividade registrada continua sendo o resultado do treino.",
  "Saved as {outcome}. This page now shows the latest result.":
    "Salvo como {outcome}. Esta página agora mostra o resultado mais recente.",
  "Could not save log.": "Não foi possível salvar o registro.",
  "Personal feedback only. Run data stays with the activity file.":
    "Somente feedback pessoal. Os dados da corrida permanecem com o arquivo da atividade.",
  "Saved to this workout.": "Salvo neste treino.",
  "Upload or review an activity file for this workout.":
    "Envie ou revise um arquivo de atividade deste treino.",
  "Feedback unavailable": "Feedback indisponível",
  "Rest days do not support Garmin review right now. If you need to log something, keep it in the workout result instead.":
    "Dias de descanso ainda não permitem revisão da Garmin. Se precisar registrar algo, use o resultado do treino.",
  "Compare your run with the plan.": "Compare sua corrida com o plano.",
  "Your Garmin file and review live here.": "Seu arquivo Garmin e a revisão ficam aqui.",
  "Add an activity file if you want a deeper review.":
    "Adicione um arquivo de atividade se quiser uma revisão mais detalhada.",
  Attached: "Anexado",
  "Saved mode only": "Somente no modo salvo",
  "Upload activity file": "Enviar arquivo de atividade",
  "Add an activity file to compare it with the plan.":
    "Adicione um arquivo de atividade para compará-lo com o plano.",
  "Hito currently accepts one Garmin {fit} activity or one {zip} archive containing exactly one FIT activity. That unlocks the comparison below.":
    "A Hito aceita atualmente uma atividade Garmin {fit} ou um arquivo {zip} contendo exatamente uma atividade FIT. Isso libera a comparação abaixo.",
  "Local QA fixture. Choose a local file through the ordinary upload control. The server keeps only the authorized safe presentation result.":
    "Fixture local de QA. Escolha um arquivo local pelo controle normal de envio. O servidor mantém apenas o resultado seguro e autorizado para apresentação.",
  "Uploading file...": "Enviando arquivo...",
  "Choose local file": "Escolher arquivo local",
  "Plan vs run": "Plano x corrida",
  "Saved coach note": "Observação salva do treinador",
  "Attached file": "Arquivo anexado",
  "Remove this file before uploading a replacement. Your manual result stays as it is.":
    "Remova este arquivo antes de enviar outro. Seu resultado manual permanece como está.",
  "Extracted activity: {fileName}": "Atividade extraída: {fileName}",
  "Removing...": "Removendo...",
  "Choose one Garmin .fit file or .zip archive.":
    "Escolha um arquivo Garmin .fit ou um arquivo .zip.",
  "Uploading activity file.": "Enviando arquivo de atividade.",
  "The Garmin result upload could not be completed.":
    "Não foi possível concluir o envio do resultado Garmin.",
  "Activity file uploaded. Plan versus run is ready to review.":
    "Arquivo de atividade enviado. A comparação entre plano e corrida está pronta para revisão.",
  "Activity file uploaded. Run captured; plan comparison is unavailable.":
    "Arquivo de atividade enviado. Corrida capturada; a comparação com o plano está indisponível.",
  "Activity file uploaded.": "Arquivo de atividade enviado.",
  "{fileName} selected. Camelot used canonical synthetic evidence; the selected bytes were not parsed or stored.":
    "{fileName} selecionado. O Camelot usou evidência sintética canônica; os bytes selecionados não foram analisados nem armazenados.",
  "Preview only.": "Somente prévia.",
  "Remove the attached Garmin evidence for this workout? The manual workout log will stay as it is.":
    "Remover a evidência Garmin anexada deste treino? O registro manual do treino permanecerá como está.",
  "Removing activity file.": "Removendo arquivo de atividade.",
  "The Garmin evidence could not be removed.": "Não foi possível remover a evidência Garmin.",
  "Sign in again before uploading a Garmin result file.":
    "Entre novamente antes de enviar um arquivo de resultado Garmin.",
  "Sign in again before changing Garmin evidence.":
    "Entre novamente antes de alterar a evidência Garmin.",
  "Choose a Garmin .fit file or a .zip archive before uploading.":
    "Escolha um arquivo Garmin .fit ou um arquivo .zip antes de enviar.",
  "Choose a workout before removing its Garmin evidence.":
    "Escolha um treino antes de remover sua evidência Garmin.",
  "Only these activity file types are supported: {acceptedKinds}.":
    "Somente estes tipos de arquivo de atividade são aceitos: {acceptedKinds}.",
  "Choose an activity file under {maxSizeMb} MB.":
    "Escolha um arquivo de atividade com menos de {maxSizeMb} MB.",
  "That workout is no longer available for activity upload.":
    "Esse treino não está mais disponível para o envio de atividade.",
  "That workout is no longer available for evidence removal.":
    "Esse treino não está mais disponível para a remoção de evidência.",
  "Activity evidence can only be attached to a running workout.":
    "A evidência de atividade só pode ser anexada a um treino de corrida.",
  "This archive does not contain a usable activity file.":
    "Este arquivo compactado não contém um arquivo de atividade utilizável.",
  "This archive contains more than {maxActivities} activity file. Upload one activity only.":
    "Este arquivo compactado contém mais de {maxActivities} arquivo de atividade. Envie apenas uma atividade.",
  "We could not read that activity file. Choose the original file and try again.":
    "Não foi possível ler esse arquivo de atividade. Escolha o arquivo original e tente novamente.",
  "This activity is already attached to another workout. Choose the matching workout instead.":
    "Esta atividade já está anexada a outro treino. Escolha o treino correspondente.",
  "We could not store that activity file. Try again shortly.":
    "Não foi possível armazenar esse arquivo de atividade. Tente novamente em instantes.",
  "We could not remove the stored activity file. Try again shortly.":
    "Não foi possível remover o arquivo de atividade armazenado. Tente novamente em instantes.",
  "The activity result could not be saved. The workout is unchanged.":
    "Não foi possível salvar o resultado da atividade. O treino não foi alterado.",
  "The activity evidence could not be removed. Try again shortly.":
    "Não foi possível remover a evidência da atividade. Tente novamente em instantes.",
  "Activity file removed. Your manual workout log is unchanged.":
    "Arquivo de atividade removido. Seu registro manual do treino não foi alterado.",
  "Sign in to use Garmin upload": "Entre para usar o envio da Garmin",
  "FIT and ZIP upload only work on saved workouts.":
    "O envio de FIT e ZIP funciona apenas em treinos salvos.",
  "Upload is not available in preview mode.": "O envio não está disponível no modo de prévia.",
  "Processing your run": "Processando sua corrida",
  "Your Garmin file is uploading now.": "Seu arquivo Garmin está sendo enviado agora.",
  "Upload in progress · comparison not ready yet.":
    "Envio em andamento · a comparação ainda não está pronta.",
  Working: "Processando",
  "We could not read that run yet": "Ainda não foi possível ler essa corrida",
  "The last Garmin file did not finish processing. Your manual workout log is unchanged.":
    "O último arquivo Garmin não terminou de ser processado. Seu registro manual do treino não foi alterado.",
  "Try another Garmin FIT or ZIP file.": "Tente outro arquivo Garmin FIT ou ZIP.",
  Retry: "Tentar novamente",
  "Your run is ready to review": "Sua corrida está pronta para revisão",
  "The comparison and saved coach note are ready to review.":
    "A comparação e a observação salva do treinador estão prontas para revisão.",
  "Your run is ready to compare": "Sua corrida está pronta para comparação",
  "The comparison is ready below.": "A comparação está pronta abaixo.",
  "Plan vs run ready": "Plano x corrida pronto",
  "Run captured": "Corrida capturada",
  "The activity is ready to review. A plan comparison is unavailable.":
    "A atividade está pronta para revisão. A comparação com o plano está indisponível.",
  "Your Garmin file is attached": "Seu arquivo Garmin está anexado",
  "The file is here, but the run summary is not ready yet.":
    "O arquivo está aqui, mas o resumo da corrida ainda não está pronto.",
  "No Garmin file yet": "Nenhum arquivo Garmin ainda",
  "Upload is optional. Add a FIT or ZIP file here to compare the run with the plan.":
    "O envio é opcional. Adicione um arquivo FIT ou ZIP aqui para comparar a corrida com o plano.",
  "No file attached yet.": "Nenhum arquivo anexado ainda.",
  "{subject} attached · comparison not ready.": "{subject} anexado · comparação ainda não pronta.",
  "{subject} · Plan vs run is ready.": "{subject} · plano x corrida pronto.",
  "{subject} processed · Plan vs run is ready.": "{subject} processado · plano x corrida pronto.",
  "{subject} · comparison not ready yet.": "{subject} · comparação ainda não pronta.",
  "{subject} processed · comparison not ready yet.":
    "{subject} processado · comparação ainda não pronta.",
  "{subject} attached · run summary not ready yet.":
    "{subject} anexado · resumo da corrida ainda não pronto.",
  "Garmin review opens after sign-in": "A revisão Garmin é liberada após entrar",
  "Saved workouts can use Feedback for Garmin FIT or ZIP review.":
    "Treinos salvos podem usar Feedback para revisar arquivos Garmin FIT ou ZIP.",
  "Open Feedback": "Abrir Feedback",
  "Garmin feedback is ready": "O feedback Garmin está pronto",
  "Review the plan-vs-run comparison and short next-step note.":
    "Revise a comparação entre plano e corrida e a breve observação do próximo passo.",
  "Review Feedback": "Revisar Feedback",
  "Garmin upload needs attention": "O envio da Garmin precisa de atenção",
  "Check the upload result in Feedback. Your manual result stays separate.":
    "Verifique o resultado do envio em Feedback. Seu resultado manual permanece separado.",
  "Garmin file is attached": "O arquivo Garmin está anexado",
  "Continue in Feedback to review the attached run file.":
    "Continue em Feedback para revisar o arquivo de corrida anexado.",
  "Continue in Feedback": "Continuar em Feedback",
  "In progress": "Em andamento",
  "Add an activity file for deeper review":
    "Adicione um arquivo de atividade para uma revisão mais detalhada",
  "Optional: compare the planned workout with the actual run in Feedback.":
    "Opcional: compare o treino planejado com a corrida realizada em Feedback.",
  "Why it still helps": "Por que ainda ajuda",
  "What stood out": "O que chamou atenção",
  "Small difference note": "Observação sobre a pequena diferença",
  "Why this is less certain": "Por que isto é menos certo",
  "Next workout": "Próximo treino",
  "Suggested next step": "Próximo passo sugerido",
  "Use this as extra context on top of the factual comparison above.":
    "Use isto como contexto adicional à comparação factual acima.",
  "Use this as a careful read of the facts above when some checks are mixed or incomplete.":
    "Use isto como uma leitura cuidadosa dos dados acima quando algumas verificações estiverem mistas ou incompletas.",
  "This stays secondary to the factual plan-vs-run section above.":
    "Isto permanece secundário à seção factual de plano x corrida acima.",
  "This stays conservative and does not change your saved plan by itself.":
    "Isto permanece conservador e não altera sozinho seu plano salvo.",
  "Use with care": "Use com cuidado",
  "Keep course": "Manter o rumo",
  "Minor note": "Observação menor",
  "Small caution": "Pequena cautela",
  "Review note": "Revisar observação",
  "Review carefully": "Revisar com cuidado",
  "the uploaded evidence is still limited": "a evidência enviada ainda é limitada",
  "the run date may not line up cleanly with the planned day":
    "a data da corrida pode não corresponder bem ao dia planejado",
  "the run came in shorter than planned": "a corrida foi mais curta que o planejado",
  "the run ran longer than planned": "a corrida durou mais que o planejado",
  "distance did not line up cleanly": "a distância não correspondeu bem ao planejado",
  "structured steps could not be compared cleanly":
    "as etapas estruturadas não puderam ser comparadas com clareza",
  "workout body notes add discomfort context":
    "as observações corporais do treino acrescentam contexto de desconforto",
  "a manual check is still worthwhile": "ainda vale a pena fazer uma verificação manual",
  "This note stays cautious because {reasons}.":
    "Esta observação permanece cautelosa porque {reasons}.",
  "Comparison details": "Detalhes da comparação",
  "Workout day": "Dia do treino",
  "Elevation loss": "Perda de elevação",
  "Average heart rate": "Frequência cardíaca média",
  "Maximum heart rate": "Frequência cardíaca máxima",
  "Average power": "Potência média",
  "Maximum power": "Potência máxima",
  "Average cadence": "Cadência média",
  Calories: "Calorias",
  "Structured intervals": "Intervalos estruturados",
  "{count} interval": "{count} intervalo",
  "{count} intervals": "{count} intervalos",
  "Observed run": "Corrida observada",
  "Comparison unavailable": "Comparação indisponível",
  "The activity was captured, but no plan comparison is available.":
    "A atividade foi capturada, mas não há comparação com o plano disponível.",
  "Complete comparison": "Comparação completa",
  "Partial comparison": "Comparação parcial",
  "Limited comparison": "Comparação limitada",
  Run: "Corrida",
  Difference: "Diferença",
  Section: "Seção",
  "Run data unavailable": "Dados da corrida indisponíveis",
  "No target": "Sem alvo",
  "Not compared": "Não comparado",
  "Matched activity": "Atividade correspondente",
  "Different activity": "Atividade diferente",
  "Same day": "Mesmo dia",
  Later: "Depois",
  Earlier: "Antes",
  "{count} day later": "{count} dia depois",
  "{count} days later": "{count} dias depois",
  "{count} day earlier": "{count} dia antes",
  "{count} days earlier": "{count} dias antes",
  "Matched structure": "Estrutura correspondente",
  "Partly matched": "Correspondência parcial",
  "Different structure": "Estrutura diferente",
  "Within plan": "Dentro do planejado",
  "Below plan": "Abaixo do planejado",
  "Above plan": "Acima do planejado",
  "{count} step": "{count} etapa",
  "{count} steps": "{count} etapas",
  "Coverage: {coverage}.": "Cobertura: {coverage}.",
  "Confidence: {confidence}%.": "Confiança: {confidence}%.",
  "Checks available: {available} of {visible}.":
    "Verificações disponíveis: {available} de {visible}.",
  "Not comparable in this upload: {items}.": "Não comparável neste envio: {items}.",
  "Duration and distance use the backend thresholds: within {matched}%, partial through {partial}%.":
    "Duração e distância usam os limites do servidor: dentro de {matched}%, parcial até {partial}%.",
  "workout day": "dia do treino",
  "workout structure": "estrutura do treino",
  "step timing": "tempo das etapas",
  "workout sections": "seções do treino",
  "heart rate": "frequência cardíaca",
  "Body notes": "Observações corporais",
  "Add any pain, tightness, or discomfort that showed up during or after this run.":
    "Adicione qualquer dor, tensão ou desconforto que tenha aparecido durante ou depois desta corrida.",
  "Edit body notes": "Editar observações corporais",
  "Add body note": "Adicionar observação corporal",
  "No body notes saved with this workout result. Leave this empty when the run felt normal.":
    "Nenhuma observação corporal foi salva com este resultado. Deixe vazio quando a corrida parecer normal.",
  "These notes stay attached to this workout result only. Use them to mark where the run felt off without turning the result into a second full form.":
    "Estas observações ficam vinculadas apenas a este resultado. Use-as para marcar onde a corrida não pareceu normal, sem transformar o resultado em outro formulário completo.",
  "No body notes yet.": "Nenhuma observação corporal ainda.",
  "{count} body note in this workout result.":
    "{count} observação corporal neste resultado de treino.",
  "{count} body notes in this workout result.":
    "{count} observações corporais neste resultado de treino.",
  "Add note": "Adicionar observação",
  "No body notes will be saved with this workout unless you add one here.":
    "Nenhuma observação corporal será salva com este treino, a menos que você adicione uma aqui.",
  "Saved fields stay bounded to area, timing, sensation, severity, and an optional note.":
    "Os campos salvos ficam limitados a área, momento, sensação, intensidade e uma observação opcional.",
  "Edit {label}: {error}": "Editar {label}: {error}",
  "invalid value {value}": "valor inválido {value}",
  "Edit {label}": "Editar {label}",
  "Add {label}": "Adicionar {label}",
  "Clear {label}": "Limpar {label}",
  "Save {label}": "Salvar {label}",
  "Edit {label} result": "Editar resultado de {label}",
  "Clear {label} result": "Limpar resultado de {label}",
  "Save {label} result": "Salvar resultado de {label}",
  "This browser could not prepare the avatar image.":
    "Este navegador não conseguiu preparar a imagem do avatar.",
  "The avatar image could not be processed.": "Não foi possível processar a imagem do avatar.",
  "Use a whole number from {min} to {max}{unit}.": "Use um número inteiro de {min} a {max}{unit}.",
  "Use {min} to {max}{unit} in {step} increments.":
    "Use de {min} a {max}{unit}, em incrementos de {step}.",
  "Save body notes": "Salvar observações corporais",
  "Body note {count}": "Observação corporal {count}",
  Remove: "Remover",
  When: "Quando",
  "During the run": "Durante a corrida",
  "After the run": "Depois da corrida",
  Sensation: "Sensação",
  "Choose one": "Escolha uma opção",
  Severity: "Intensidade",
  "Restore session severity {value} out of 5": "Restaurar intensidade da sessão: {value} de 5",
  "Severity {value} out of 5": "Intensidade {value} de 5",
  "1 is light discomfort. 5 is the strongest note.":
    "1 é desconforto leve. 5 é a observação mais intensa.",
  Detail: "Detalhe",
  "What did you feel, and when did it show up?": "O que você sentiu e quando apareceu?",
  "Body location": "Local do corpo",
  "Pick one bounded area for this note. Add another note if more than one spot felt off.":
    "Escolha uma área delimitada para esta observação. Adicione outra se mais de um local apresentou desconforto.",
  "Body map side": "Lado do mapa corporal",
  Front: "Frente",
  Back: "Costas",
  "{area} selected": "{area} selecionada",
  "Choose one area for this note.": "Escolha uma área para esta observação.",
  Selected: "Selecionada",
  "Severity {value} of 5": "Intensidade {value} de 5",
  "No sensation selected": "Nenhuma sensação selecionada",
  Neck: "Pescoço",
  "L. Shoulder": "Ombro esq.",
  "R. Shoulder": "Ombro dir.",
  "Lower back": "Lombar",
  "L. Hip": "Quadril esq.",
  "R. Hip": "Quadril dir.",
  "L. Quad": "Quadríceps esq.",
  "R. Quad": "Quadríceps dir.",
  "L. Knee": "Joelho esq.",
  "R. Knee": "Joelho dir.",
  "L. Calf": "Panturrilha esq.",
  "R. Calf": "Panturrilha dir.",
  "L. Ankle": "Tornozelo esq.",
  "R. Ankle": "Tornozelo dir.",
  "L. Foot": "Pé esq.",
  "R. Foot": "Pé dir.",
  Sore: "Dolorido",
  Tight: "Tenso",
  Sharp: "Agudo",
  Dull: "Surdo",
  Swollen: "Inchado",
  Stiff: "Rígido",
  "Calendar JSON not saved": "JSON do Calendário não salvo",
  "Plan not saved": "Plano não salvo",
  "Calendar JSON flow ready": "Fluxo de JSON do Calendário pronto",
  "Plan saved to Plans": "Plano salvo em Planos",
  "{title} was exported and saved to Plans with {count} workout. Your Calendar was not changed.":
    "{title} foi exportado e salvo em Planos com {count} treino. Seu Calendário não foi alterado.",
  "{title} was exported and saved to Plans with {count} workouts. Your Calendar was not changed.":
    "{title} foi exportado e salvo em Planos com {count} treinos. Seu Calendário não foi alterado.",
  "{title} was saved. Your Calendar was not changed.":
    "{title} foi salvo. Seu Calendário não foi alterado.",
  "Saving plan to Plans": "Salvando plano em Planos",
  "Your Calendar will not be changed.": "Seu Calendário não será alterado.",
  "Plan save not confirmed": "Salvamento do plano não confirmado",
  "The upload result could not be confirmed. Check Plans before trying again.":
    "Não foi possível confirmar o resultado do envio. Verifique Planos antes de tentar novamente.",
  "Checking Calendar JSON flow": "Verificando o fluxo de JSON do Calendário",
  "Exporting the current future Calendar and saving that exact JSON to Plans.":
    "Exportando o Calendário futuro atual e salvando exatamente esse JSON em Planos.",
  "Calendar JSON flow not confirmed": "Fluxo de JSON do Calendário não confirmado",
  "The future Calendar JSON could not be exported or saved. Nothing was changed.":
    "Não foi possível exportar ou salvar o JSON do Calendário futuro. Nada foi alterado.",
  "Opening plan creation": "Abrindo criação de plano",
  "Deleting future workouts": "Excluindo treinos futuros",
  "Removing eligible upcoming Calendar workouts first.":
    "Removendo primeiro os próximos treinos elegíveis do Calendário.",
  "Removing eligible upcoming Calendar workouts.":
    "Removendo os próximos treinos elegíveis do Calendário.",
  "Plan creation not opened": "Criação de plano não aberta",
  "Future workouts not deleted": "Treinos futuros não excluídos",
  "Future workouts deleted": "Treinos futuros excluídos",
  "{count} eligible upcoming workout was deleted.": "{count} próximo treino elegível foi excluído.",
  "{count} eligible upcoming workouts were deleted.":
    "{count} próximos treinos elegíveis foram excluídos.",
  "Calendar needs refresh": "O Calendário precisa ser atualizado",
  "{count} eligible upcoming workout was deleted, but the latest Calendar could not be refreshed.":
    "{count} próximo treino elegível foi excluído, mas não foi possível atualizar o Calendário mais recente.",
  "{count} eligible upcoming workouts were deleted, but the latest Calendar could not be refreshed.":
    "{count} próximos treinos elegíveis foram excluídos, mas não foi possível atualizar o Calendário mais recente.",
  "The request result could not be confirmed. Refresh Calendar before trying again.":
    "Não foi possível confirmar o resultado da solicitação. Atualize o Calendário antes de tentar novamente.",
  "The delete result could not be confirmed. Refresh Calendar before trying again.":
    "Não foi possível confirmar o resultado da exclusão. Atualize o Calendário antes de tentar novamente.",
  "Open Calendar actions": "Abrir ações do Calendário",
  "Download future workouts JSON": "Baixar JSON dos treinos futuros",
  "Upload plan JSON": "Enviar JSON do plano",
  "Check Calendar JSON flow": "Verificar fluxo de JSON do Calendário",
  "Start a new plan": "Iniciar um novo plano",
  "Delete future workouts": "Excluir treinos futuros",
  "Start a new plan?": "Iniciar um novo plano?",
  "Delete future workouts?": "Excluir treinos futuros?",
  "Eligible upcoming workouts will be removed before plan creation opens.":
    "Os próximos treinos elegíveis serão removidos antes da abertura da criação do plano.",
  "This removes eligible upcoming Calendar workouts.":
    "Isso remove os próximos treinos elegíveis do Calendário.",
  "Past workouts, results, and FIT records are not touched.":
    "Treinos passados, resultados e registros FIT não são alterados.",
  "Saved plan": "Plano salvo",
  "Your saved plan is active, but the provider connections listed here are not connected unless they say Live.":
    "Seu plano salvo está ativo, mas as conexões de provedores listadas aqui não estão conectadas, a menos que indiquem Ao vivo.",
  "This page shows what is available now and what still comes later.":
    "Esta página mostra o que está disponível agora e o que virá depois.",
  Devices: "Dispositivos",
  Intelligence: "Inteligência",
  "Available now and later": "Disponível agora e depois",
  Live: "Ao vivo",
  "Not connected yet.": "Ainda não conectado.",
  "Workout feedback": "Feedback do treino",
  "Available inside each workout in Feedback. Add a Garmin file, compare plan vs run, and read the next-step note there.":
    "Disponível dentro de cada treino em Feedback. Adicione um arquivo Garmin, compare plano x corrida e leia ali a observação do próximo passo.",
  "Screenshot import": "Importação de captura de tela",
  "Not available yet.": "Ainda não disponível.",
  "Plan adjustments": "Ajustes do plano",
  "Not automatic yet.": "Ainda não automático.",
  "Open feedback": "Abrir feedback",
  "Open calendar": "Abrir calendário",
  "Available now: workout Feedback for Garmin upload, plan-vs-run review, and a short next-step note. Still later: screenshot import, provider sync, and broader plan adjustments.":
    "Disponível agora: Feedback do treino para envio Garmin, revisão de plano x corrida e uma breve observação do próximo passo. Para depois: importação de captura de tela, sincronização com provedores e ajustes mais amplos do plano.",
  "Next training block": "Próximo bloco de treino",
  "Confirm the current goal and availability before saving this check-in.":
    "Confirme a meta e a disponibilidade atuais antes de salvar este check-in.",
  "This Blueprint changed. Reload before saving the check-in.":
    "Esta estrutura mudou. Recarregue antes de salvar o check-in.",
  "The Blueprint source is no longer available.": "A fonte da estrutura não está mais disponível.",
  "Check-in and preferences saved.": "Check-in e preferências salvos.",
  "The check-in could not be saved.": "Não foi possível salvar o check-in.",
  "The next block is not ready. Review the current missing facts and check-in.":
    "O próximo bloco não está pronto. Revise os dados ausentes atuais e o check-in.",
  "The server rejected the authored candidate. Try again after reviewing the current state.":
    "O servidor rejeitou o candidato preparado. Tente novamente depois de revisar o estado atual.",
  "The next block is ready for review.": "O próximo bloco está pronto para revisão.",
  "The next block could not be prepared.": "Não foi possível preparar o próximo bloco.",
  "Review sealed against current Calendar and Blueprint truth.":
    "Revisão selada com base nos dados atuais do Calendário e da estrutura.",
  "The next block could not be reviewed.": "Não foi possível revisar o próximo bloco.",
  "Next block confirmed in the runner Calendar.":
    "Próximo bloco confirmado no Calendário do corredor.",
  "The next block could not be confirmed.": "Não foi possível confirmar o próximo bloco.",
  "Choose a Blueprint date to avoid.": "Escolha uma data da estrutura a evitar.",
  "That date is already included.": "Essa data já está incluída.",
  "Choose two different Blueprint dates to swap.":
    "Escolha duas datas diferentes da estrutura para trocar.",
  "Prepare next block": "Preparar próximo bloco",
  "Confirm next block": "Confirmar próximo bloco",
  "Review next block": "Revisar próximo bloco",
  "Next block check-in": "Check-in do próximo bloco",
  "Is your goal assumption still current?": "A suposição sobre sua meta ainda está atual?",
  "Does this availability still work for the next block?":
    "Esta disponibilidade ainda funciona para o próximo bloco?",
  "Current manageability": "Gerenciamento atual",
  "Current health limitation": "Limitação de saúde atual",
  "Recent interruption": "Interrupção recente",
  "Clinician guidance": "Orientação clínica",
  "Material changes or context": "Mudanças relevantes ou contexto",
  "One-off Blueprint preferences": "Preferências pontuais da estrutura",
  "Date to avoid": "Data a evitar",
  "Add avoid date": "Adicionar data a evitar",
  "First slot": "Primeiro espaço",
  "Second slot": "Segundo espaço",
  "Add swap": "Adicionar troca",
  "Active Blueprint preferences": "Preferências ativas da estrutura",
  "Save check-in and preferences": "Salvar check-in e preferências",
  "Candidate review": "Revisão do candidato",
  "Evidence cutoff {date} · {performance}": "Corte das evidências em {date} · {performance}",
  "Candidate missing facts": "Dados ausentes do candidato",
  "Candidate conflicts": "Conflitos do candidato",
  Conflict: "Conflito",
  "Calendar date {date} is occupied.": "A data {date} do Calendário está ocupada.",
  "Canonical WorkoutDocument review": "Revisão canônica do WorkoutDocument",
  Yes: "Sim",
  No: "Não",
  "Too much": "Demais",
  Manageable: "Gerenciável",
  "Too little": "Muito pouco",
  Unsure: "Não tenho certeza",
  None: "Nenhuma",
  Resolved: "Resolvida",
  Unresolved: "Não resolvida",
  "Not applicable": "Não se aplica",
  "Permits running": "Permite correr",
  "Restricts running": "Restringe a corrida",
  Unclear: "Não está claro",
  Due: "Devidos",
  "FIT current": "FIT atual",
  "Without FIT": "Sem FIT",
  Missing: "Ausentes",
  Removed: "Removidos",
  "Continuation data quality": "Qualidade dos dados de continuação",
  "Preference outcomes": "Resultados das preferências",
  Applied: "Aplicada",
  "Not applied": "Não aplicada",
  "Continuation reasons": "Motivos da continuação",
  "Not ready": "Não está pronto",
  "Ready to prepare": "Pronto para preparar",
  "The current detailed block is still active. The server will open the next check-in at the continuation window.":
    "O bloco detalhado atual ainda está ativo. O servidor abrirá o próximo check-in na janela de continuação.",
  "Confirm the current goal, availability, manageability, health context, and one-off Blueprint preferences.":
    "Confirme a meta, disponibilidade, gerenciamento e contexto de saúde atuais, além das preferências pontuais da estrutura.",
  "The next block cannot be prepared from current facts yet. Review the exact missing or unresolved items below.":
    "O próximo bloco ainda não pode ser preparado com os dados atuais. Revise abaixo os itens exatos ausentes ou não resolvidos.",
  "Current facts and the retained check-in are ready for explicit next-block preparation.":
    "Os dados atuais e o check-in mantido estão prontos para a preparação explícita do próximo bloco.",
  "Review the canonical workouts, facts, preferences, and conflicts before explicit Calendar confirmation.":
    "Revise os treinos canônicos, dados, preferências e conflitos antes da confirmação explícita no Calendário.",
  "Four-week block": "Bloco de quatro semanas",
  "Target-date or taper block": "Bloco de data-alvo ou polimento",
  "Resolved-interruption bridge": "Ponte após interrupção resolvida",
  "Blueprint-faithful · no performance inference":
    "Fiel à estrutura · sem inferência de desempenho",
  "Constraint-only · no performance inference": "Somente restrições · sem inferência de desempenho",
  "Fact-shaped from comparable FIT and RPE": "Modelado por dados comparáveis de FIT e PSE",
  "Avoid {date}": "Evitar {date}",
  "Swap {first} and {second}": "Trocar {first} e {second}",
  "Hito could not move this workout yet. Try again from the calendar.":
    "A Hito ainda não conseguiu mover este treino. Tente novamente pelo calendário.",
  "Replacing workout": "Substituindo treino",
  "Moving workout": "Movendo treino",
  "Hito is confirming the reviewed replacement.":
    "A Hito está confirmando a substituição revisada.",
  "Hito is confirming the reviewed move.": "A Hito está confirmando a movimentação revisada.",
  "Workout not replaced": "Treino não substituído",
  "Workout not moved": "Treino não movido",
  "Workout replaced": "Treino substituído",
  "Workout moved": "Treino movido",
  "Saved to your calendar.": "Salvo no seu calendário.",
  "Reviewing replacement": "Revisando substituição",
  "Reviewing move": "Revisando movimentação",
  "Hito is checking the target workout before anything is replaced.":
    "A Hito está verificando o treino de destino antes de qualquer substituição.",
  "Hito is checking the Calendar before moving this workout.":
    "A Hito está verificando o Calendário antes de mover este treino.",
  "Move blocked": "Movimentação bloqueada",
  "Replacement reviewed": "Substituição revisada",
  "Confirm before Hito replaces the target workout.":
    "Confirme antes que a Hito substitua o treino de destino.",
  "Move review failed": "Falha na revisão da movimentação",
  "Replace target workout?": "Substituir o treino de destino?",
  "This will replace the workout currently on the target day.":
    "Isso substituirá o treino que está atualmente no dia de destino.",
  "Replacing...": "Substituindo...",
  "Replace workout": "Substituir treino",
  "Workout copied": "Treino copiado",
  "{title} is ready to paste into an empty day.":
    "{title} está pronto para ser colado em um dia vazio.",
  "Move source selected": "Treino de origem selecionado",
  "Pick a day to move or replace from the calendar.":
    "Escolha um dia no calendário para mover ou substituir.",
  "Reviewing clear": "Revisando remoção",
  "Hito is checking whether this manual workout can be cleared.":
    "A Hito está verificando se este treino manual pode ser removido.",
  "Clear blocked": "Remoção bloqueada",
  "Could not review this workout for clearing.":
    "Não foi possível revisar este treino para remoção.",
  "Clear reviewed": "Remoção revisada",
  "Confirm before Hito removes this Calendar workout.":
    "Confirme antes que a Hito remova este treino do Calendário.",
  "Clear review failed": "Falha na revisão da remoção",
  "Clearing workout": "Removendo treino",
  "Hito is confirming this Calendar change before removing the workout row.":
    "A Hito está confirmando esta alteração no Calendário antes de remover a linha do treino.",
  "Workout not cleared": "Treino não removido",
  "The Calendar workout could not be cleared.": "Não foi possível remover o treino do Calendário.",
  "Workout cleared": "Treino removido",
  "Refreshing from saved Calendar truth.": "Atualizando com os dados salvos do Calendário.",
  "The Calendar returned an unsupported editor initializer.":
    "O Calendário retornou uma inicialização de editor incompatível.",
  "This workout could not be opened for editing.":
    "Não foi possível abrir este treino para edição.",
  "Workout updated": "Treino atualizado",
  "This workout could not be updated.": "Não foi possível atualizar este treino.",
  "Save workout": "Salvar treino",
  "Copy workout": "Copiar treino",
  "Move workout": "Mover treino",
  "Clear workout": "Remover treino",
  "Review clear workout": "Revisar remoção do treino",
  "Confirm before Hito removes this workout from your Calendar.":
    "Confirme antes que a Hito remova este treino do seu Calendário.",
  "Selected Calendar day for the workout being cleared.":
    "Dia do Calendário selecionado para o treino que será removido.",
  Verified: "Verificado",
  "What changes": "O que muda",
  "Hito deletes exactly this workout row and refreshes the Calendar from saved truth.":
    "A Hito exclui exatamente esta linha de treino e atualiza o Calendário com os dados salvos.",
  "Calendar only": "Somente Calendário",
  "If you need it again": "Se precisar dele novamente",
  "Add it again from the Calendar later. Hito will review it as a new workout before saving anything.":
    "Adicione-o novamente pelo Calendário depois. A Hito o revisará como um novo treino antes de salvar qualquer coisa.",
  "Add later": "Adicionar depois",
  "Clearing workout...": "Removendo treino...",
  "Workout guidance": "Orientação do treino",
  "Reviewed structure": "Estrutura revisada",
  "Hito could not paste this workout yet. Try again from the calendar.":
    "A Hito ainda não conseguiu colar este treino. Tente novamente pelo calendário.",
  "The Calendar initializer cannot open a create flow.":
    "O inicializador do Calendário não pode abrir um fluxo de criação.",
  "The workout could not be initialized.": "Não foi possível inicializar o treino.",
  "Workout templates are not available right now.":
    "Os modelos de treino não estão disponíveis agora.",
  "Workout templates could not be loaded.": "Não foi possível carregar os modelos de treino.",
  "Reviewing workout": "Revisando treino",
  "Hito is validating the manual draft before anything is saved.":
    "A Hito está validando o rascunho manual antes de salvar qualquer coisa.",
  "Workout needs changes": "O treino precisa de alterações",
  "The workout could not be reviewed.": "Não foi possível revisar o treino.",
  "Workout reviewed": "Treino revisado",
  "Check the reviewed workout before adding it to the Calendar.":
    "Verifique o treino revisado antes de adicioná-lo ao Calendário.",
  "Could not review this manual workout yet.": "Ainda não foi possível revisar este treino manual.",
  "Review failed": "Falha na revisão",
  "Review this manual workout before saving it as a template.":
    "Revise este treino manual antes de salvá-lo como modelo.",
  "The template could not be reviewed.": "Não foi possível revisar o modelo.",
  "Template saved": "Modelo salvo",
  "{name} is available in your template picker.": "{name} está disponível no seletor de modelos.",
  "The workout template catalog could not be updated.":
    "Não foi possível atualizar o catálogo de modelos de treino.",
  "Template update failed": "Falha na atualização do modelo",
  "Adding workout": "Adicionando treino",
  "Hito is confirming the reviewed workout.": "A Hito está confirmando o treino revisado.",
  "Workout not added": "Treino não adicionado",
  "Workout added": "Treino adicionado",
  "The workout could not be added to the Calendar.":
    "Não foi possível adicionar o treino ao Calendário.",
  "Pasting workout": "Colando treino",
  "Hito is copying from the saved source workout.":
    "A Hito está copiando a partir do treino de origem salvo.",
  "Paste blocked": "Colagem bloqueada",
  "Workout pasted": "Treino colado",
  "Refreshing the calendar from saved workout truth.":
    "Atualizando o calendário com os dados salvos do treino.",
  "Workout not pasted": "Treino não colado",
  "Move selected workout here": "Mover o treino selecionado para cá",
  "Cancel move": "Cancelar movimentação",
  "Keep the source workout where it is.": "Manter o treino de origem onde está.",
  "Paste copied workout": "Colar treino copiado",
  "Save the copied workout into this empty day.": "Salvar o treino copiado neste dia vazio.",
  "Start from scratch": "Começar do zero",
  "Start with a blank workout.": "Começar com um treino em branco.",
  "Choose template": "Escolher modelo",
  "Browse built-in and saved templates.": "Explorar modelos integrados e salvos.",
  "Add rest day": "Adicionar dia de descanso",
  "Create an intentional no-run day.": "Criar um dia intencional sem corrida.",
  "Deleting template": "Excluindo modelo",
  "Removing {name} from your templates.": "Removendo {name} dos seus modelos.",
  "Template deleted": "Modelo excluído",
  "{name} was removed from your templates.": "{name} foi removido dos seus modelos.",
  "Hiding template": "Ocultando modelo",
  "Removing {name} from your visible built-in templates.":
    "Removendo {name} dos modelos integrados visíveis.",
  "Template hidden": "Modelo ocultado",
  "{name} is hidden for this account.": "{name} está ocultado para esta conta.",
  "Restoring templates": "Restaurando modelos",
  "Restoring all built-in workout templates for this account.":
    "Restaurando todos os modelos de treino integrados desta conta.",
  "Templates restored": "Modelos restaurados",
  "All built-in workout templates are visible again.":
    "Todos os modelos de treino integrados estão visíveis novamente.",
  "Restoring template": "Restaurando modelo",
  "Restoring {name} to your visible built-in templates.":
    "Restaurando {name} nos modelos integrados visíveis.",
  "Template restored": "Modelo restaurado",
  "{name} is visible in the picker again.": "{name} está visível novamente no seletor.",
  "Adding workout...": "Adicionando treino...",
  Reviewed: "Revisado",
  Draft: "Rascunho",
  "Manual workout": "Treino manual",
  "Loading the canonical workout document.": "Carregando o documento canônico do treino.",
  "Warning: {warning}": "Aviso: {warning}",
  "Reviewing workout...": "Revisando treino...",
  "Review workout": "Revisar treino",
  "The workout template could not be saved.": "Não foi possível salvar o modelo de treino.",
  "Save as template": "Salvar como modelo",
  "Save this reviewed workout as a personal template. Hito rebuilds and checks it before it appears in your picker.":
    "Salve este treino revisado como um modelo pessoal. A Hito o reconstrói e verifica antes que apareça no seletor.",
  "Template name": "Nome do modelo",
  "Easy aerobic run": "Corrida aeróbica leve",
  "Calendar icon": "Ícone do Calendário",
  "Template calendar icon": "Ícone do modelo no Calendário",
  "This icon only changes how your personal template appears in the picker.":
    "Este ícone altera apenas como seu modelo pessoal aparece no seletor.",
  "Save template": "Salvar modelo",
  "Review before replacing the Calendar workout on this day.":
    "Revise antes de substituir o treino do Calendário neste dia.",
  "Use this Rest day as the target.": "Usar este dia de descanso como destino.",
  "Workout title": "Título do treino",
  "Moved section to position {position}.": "Seção movida para a posição {position}.",
  "Added {label}.": "{label} adicionada.",
  "Deleted {label}.": "{label} excluída.",
  "Duplicated {label}.": "{label} duplicada.",
  section: "seção",
  "Add workout section": "Adicionar seção de treino",
  "Rest day has no running sections.": "O dia de descanso não tem seções de corrida.",
  "Add at least one section before review.": "Adicione pelo menos uma seção antes da revisão.",
  "Notes or cues": "Observações ou instruções",
  "Section label": "Rótulo da seção",
  "Section type": "Tipo de seção",
  "Section {count} type": "Tipo da seção {count}",
  "Section {count}": "Seção {count}",
  Guidance: "Orientação",
  "Move {label} up": "Mover {label} para cima",
  "Move {label} down": "Mover {label} para baixo",
  "Move up": "Mover para cima",
  "Move down": "Mover para baixo",
  Duplicate: "Duplicar",
  "Delete section": "Excluir seção",
  "Moved repeat child to position {position}.": "Seção repetida movida para a posição {position}.",
  "Repeat sections": "Seções repetidas",
  "Repeat label": "Rótulo da repetição",
  "Repeat role": "Função da repetição",
  "Repeat section {count} role": "Função da seção repetida {count}",
  "Repeat section {count}": "Seção repetida {count}",
  "repeat section": "seção repetida",
  Delete: "Excluir",
  "Add repeat section": "Adicionar seção repetida",
  "Duration mode": "Modo de duração",
  "Section duration mode": "Modo de duração da seção",
  Minutes: "Minutos",
  Repeats: "Repetições",
  "No quantity": "Sem quantidade",
  Kilometres: "Quilômetros",
  "Repeat count": "Quantidade de repetições",
  "Repeat section duration mode": "Modo de duração da seção repetida",
  Target: "Alvo",
  "{role} target type": "Tipo de alvo de {role}",
  "Pace range": "Faixa de ritmo",
  "HR cap": "Limite de FC",
  "HR range": "Faixa de FC",
  RPE: "PSE",
  Value: "Valor",
  "Warm-up": "Aquecimento",
  Work: "Trabalho",
  "Cool-down": "Desaquecimento",
  Walk: "Caminhada",
  Recover: "Recuperar",
  Finish: "Finalizar",
  Cooldown: "Desaquecimento",
  "Choose a template, adjust the workout, then ask Hito to review it before anything is created.":
    "Escolha um modelo, ajuste o treino e peça para a Hito revisá-lo antes que qualquer coisa seja criada.",
  "Workout templates could not be loaded": "Não foi possível carregar os modelos de treino",
  Loading: "Carregando",
  "Checking workout templates": "Verificando modelos de treino",
  "Hito is loading built-in and personal templates for this account.":
    "A Hito está carregando os modelos integrados e pessoais desta conta.",
  "My templates": "Meus modelos",
  Refresh: "Atualizar",
  Empty: "Vazio",
  "Save a reviewed workout to reuse it as a personal template.":
    "Salve um treino revisado para reutilizá-lo como modelo pessoal.",
  "Delete template": "Excluir modelo",
  "Actions for {name}": "Ações de {name}",
  "Built-in templates": "Modelos integrados",
  "Restore a built-in template below to show it in the picker.":
    "Restaure um modelo integrado abaixo para exibi-lo no seletor.",
  "Hide from picker": "Ocultar do seletor",
  "Hidden built-ins": "Modelos integrados ocultos",
  "Restore all": "Restaurar todos",
  Restore: "Restaurar",
  "Rest / no run": "Descanso / sem corrida",
  Structure: "Estrutura",
  "1 section repeats together": "1 seção se repete em conjunto",
  "{count} sections repeat together": "{count} seções se repetem em conjunto",
  "Workout structure preview": "Prévia da estrutura do treino",
  "No structure": "Sem estrutura",
  "No extra workout structure was provided for this manual workout.":
    "Nenhuma estrutura adicional foi fornecida para este treino manual.",
  "{date} workout preview": "Prévia do treino de {date}",
  "{count} repeats": "{count} repetições",
  "Choose {goal} before creating this plan.": "Escolha {goal} antes de criar este plano.",
  "Enter a workout title.": "Informe um título para o treino.",
  "Add at least one workout section.": "Adicione pelo menos uma seção de treino.",
  "Workout sections require unique stable identities.":
    "As seções do treino precisam de identificadores estáveis exclusivos.",
  "{label} requires positive minutes.": "{label} exige minutos positivos.",
  "{label} requires a positive distance.": "{label} exige uma distância positiva.",
  "{label} requires 2–50 repeats.": "{label} exige de 2 a 50 repetições.",
  "Repeat sections require unique stable identities.":
    "As seções repetidas precisam de identificadores estáveis exclusivos.",
  "{label} requires a pace value.": "{label} exige um valor de ritmo.",
  "{label} requires a heart-rate value.": "{label} exige um valor de frequência cardíaca.",
  "{label} requires RPE from 0 to 10.": "{label} exige PSE de 0 a 10.",
  "Review returned no Workout document.": "A revisão não retornou um documento de treino.",
  "Workout structure": "Estrutura do treino",
  "No running parts to preview.": "Nenhuma parte de corrida para visualizar.",
  "No workout structure available.": "Nenhuma estrutura de treino disponível.",
  "Distance by FIT-recorded run": "Distância por corrida registrada via FIT",
  "Review the supplied distance for every FIT-recorded run in the exact selected period.":
    "Revise a distância informada para cada corrida registrada via FIT no período exato selecionado.",
  "Timer duration by FIT-recorded run": "Duração do cronômetro por corrida registrada via FIT",
  "Review the supplied timer duration for every FIT-recorded run in the exact selected period.":
    "Revise a duração do cronômetro informada para cada corrida registrada via FIT no período exato selecionado.",
  "Observed average pace by FIT-recorded run":
    "Ritmo médio observado por corrida registrada via FIT",
  "Review each supplied whole-activity observed pace without combining different workouts.":
    "Revise cada ritmo observado da atividade completa sem combinar treinos diferentes.",
  "Elevation gain by FIT-recorded run": "Ganho de elevação por corrida registrada via FIT",
  "Review the supplied elevation gain for every FIT-recorded run in the exact selected period.":
    "Revise o ganho de elevação informado para cada corrida registrada via FIT no período exato selecionado.",
  "Reported load by FIT-recorded run": "Carga informada por corrida registrada via FIT",
  "Review the supplied session-RPE load for every FIT-recorded run in the exact selected period.":
    "Revise a carga de PSE da sessão informada para cada corrida registrada via FIT no período exato selecionado.",
  "Different workouts are not directly comparable.":
    "Treinos diferentes não são diretamente comparáveis.",
  activity: "atividade",
  activities: "atividades",
  "No activity evidence": "Nenhuma evidência de atividade",
  "No FIT-recorded runs from {startDate} to {endDate}.":
    "Nenhuma corrida registrada via FIT de {startDate} a {endDate}.",
  "Sequence unavailable": "Sequência indisponível",
  "The supplied activity sequence is incomplete. No partial member set is shown.":
    "A sequência de atividades fornecida está incompleta. Nenhum conjunto parcial é exibido.",
  "Updating sequence": "Atualizando sequência",
  "The activity sequence is unavailable.": "A sequência de atividades está indisponível.",
  "Available · solid point": "Disponível · ponto sólido",
  "Partial · outlined point": "Parcial · ponto contornado",
  "Unavailable · N/A point": "Indisponível · ponto N/D",
  "Future · {startDate}–{endDate} · not missing data":
    "Futuro · {startDate}–{endDate} · não são dados ausentes",
  "Close active activity": "Fechar atividade ativa",
  "Running context unavailable": "Contexto de corrida indisponível",
  "View data": "Ver dados",
  "Date and time": "Data e hora",
  "Selected metric": "Métrica selecionada",
  Context: "Contexto",
  "Evidence and coverage": "Evidência e cobertura",
  Reason: "Motivo",
  "Runner-reported effort is missing.": "O esforço informado pelo corredor não está disponível.",
  "Distance was not available in the FIT file.":
    "A distância não estava disponível no arquivo FIT.",
  "Observed distance or duration was not available for pace.":
    "A distância ou a duração observada não estava disponível para o ritmo.",
  "Elevation gain was not available in the FIT file.":
    "O ganho de elevação não estava disponível no arquivo FIT.",
  Unknown: "Desconhecido",
  "Time unavailable": "Horário indisponível",
  "{includedCount} of {candidateCount} included": "{includedCount} de {candidateCount} incluídas",
  "Chart unavailable": "Gráfico indisponível",
  "Updating chart": "Atualizando gráfico",
  "Partial · striped bar": "Parcial · barra listrada",
  "Unavailable · N/A gap marker": "Indisponível · marcador N/D",
  "Close active point": "Fechar ponto ativo",
  Completion: "Conclusão",
  Coverage: "Cobertura",
  "28 days": "28 dias",
  "Recorded whole-activity distance": "Distância registrada da atividade completa",
  "From FIT file": "Do arquivo FIT",
  "{startDate} through {endDate}": "{startDate} a {endDate}",
  "Partial week": "Semana parcial",
  "Complete week": "Semana completa",
  "To date": "Até o momento",
  "{includedCount} of {candidateCount} accepted activities":
    "{includedCount} de {candidateCount} atividades aceitas",
  "Add activity": "Adicionar atividade",
  "Add activity for {date}": "Adicionar atividade em {date}",
  "Choose FIT or ZIP": "Escolher FIT ou ZIP",
  "Choose one FIT file or a ZIP containing exactly one FIT activity. Maximum file size: 25 MB.":
    "Escolha um arquivo FIT ou um ZIP que contenha exatamente uma atividade FIT. Tamanho máximo: 25 MB.",
  "Uploading and processing activity…": "Enviando e processando a atividade…",
  "Uploading…": "Enviando…",
  "Loading saved activity…": "Carregando atividade salva…",
  "Activity saved. Review the facts before adding it to Calendar.":
    "Atividade salva. Revise os fatos antes de adicioná-la ao Calendário.",
  "This activity was already uploaded. Continue where you left off.":
    "Esta atividade já foi enviada. Continue de onde parou.",
  "Saved · Not on Calendar": "Salva · Fora do Calendário",
  "Saved · On Calendar": "Salva · No Calendário",
  "Activity title": "Título da atividade",
  "Activity started from {date}": "Atividade iniciada em {date}",
  "Review the saved activity before adding it to Calendar.":
    "Revise a atividade salva antes de adicioná-la ao Calendário.",
  "Calendar placement": "Posicionamento no Calendário",
  "You started from {clickedDate}. This FIT file records {fitDate}, so Hito will use {fitDate}.":
    "Você começou em {clickedDate}. Este arquivo FIT registra {fitDate}, então a Hito usará {fitDate}.",
  "This activity will be added to {date}.": "Esta atividade será adicionada em {date}.",
  "A workout already exists on {date}. Association keeps its title, structure, and origin unchanged.":
    "Já existe um treino em {date}. A associação mantém título, estrutura e origem inalterados.",
  "Calendar association": "Associação ao Calendário",
  "Associate with {workout}": "Associar a {workout}",
  "This activity is saved, but it can't be associated with the workout on {date}.":
    "Esta atividade está salva, mas não pode ser associada ao treino de {date}.",
  "This activity is saved, but a today or future FIT date cannot be added from this historical flow.":
    "Esta atividade está salva, mas uma data FIT de hoje ou do futuro não pode ser adicionada por este fluxo histórico.",
  "The activity date is not available in this FIT file.":
    "A data da atividade não está disponível neste arquivo FIT.",
  "Calendar changed after this review opened. Close and resume from Activity History.":
    "O Calendário mudou depois que esta revisão foi aberta. Feche e retome pelo Histórico de atividades.",
  "Activity facts": "Fatos da atividade",
  "Activity date": "Data da atividade",
  Sport: "Esporte",
  "Timer time": "Tempo do cronômetro",
  "Elapsed time": "Tempo decorrido",
  "{minutes} min · {basis}": "{minutes} min · {basis}",
  "{distance} km": "{distance} km",
  Ascent: "Subida",
  Descent: "Descida",
  "Not available in this FIT file": "Não disponível neste arquivo FIT",
  "Not available in this FIT file: {facts}.": "Não disponível neste arquivo FIT: {facts}.",
  Laps: "Voltas",
  "Structured steps": "Etapas estruturadas",
  "{label} · {count}": "{label} · {count}",
  "No laps were recorded in this FIT file.": "Nenhuma volta foi registrada neste arquivo FIT.",
  "No structured workout steps were recorded in this FIT file.":
    "Nenhuma etapa estruturada de treino foi registrada neste arquivo FIT.",
  "FIT structure": "Estrutura FIT",
  Step: "Etapa",
  "Source details": "Detalhes da origem",
  "Original filename": "Nome do arquivo original",
  "Extracted FIT filename": "Nome do arquivo FIT extraído",
  "Source kind": "Tipo de origem",
  "File import": "Importação de arquivo",
  "Original file": "Arquivo original",
  "Activity ID": "ID da atividade",
  "Revision ID": "ID da revisão",
  "The activity is saved in Activity History. You can finish adding it to Calendar later.":
    "A atividade está salva no Histórico de atividades. Você pode concluir a adição ao Calendário depois.",
  "Confirm and add to Calendar": "Confirmar e adicionar ao Calendário",
  "Confirm association": "Confirmar associação",
  "Adding activity to Calendar…": "Adicionando atividade ao Calendário…",
  "Activity added to Calendar.": "Atividade adicionada ao Calendário.",
  "Activity added. Calendar and evidence are updating.":
    "Atividade adicionada. O Calendário e as evidências estão sendo atualizados.",
  "Activity associated with the existing workout.": "Atividade associada ao treino existente.",
  "Activity added to {date}": "Atividade adicionada em {date}",
  "Activity associated with {workout} on {date}": "Atividade associada a {workout} em {date}",
  "View activity history": "Ver histórico de atividades",
  "Finish adding to Calendar": "Concluir adição ao Calendário",
  "Connection interrupted. Check whether the activity was saved before uploading again.":
    "A conexão foi interrompida. Verifique se a atividade foi salva antes de enviar novamente.",
  "Check Activity History before uploading again so the same activity is not duplicated.":
    "Verifique o Histórico de atividades antes de enviar novamente para não duplicar a mesma atividade.",
  "Check upload status": "Verificar status do envio",
  "The activity file could not be processed. Try again shortly.":
    "Não foi possível processar o arquivo da atividade. Tente novamente em instantes.",
  "The saved activity review is unavailable. Check Activity History.":
    "A revisão da atividade salva está indisponível. Verifique o Histórico de atividades.",
  "This saved activity could not be opened. Refresh Activity History and try again.":
    "Não foi possível abrir esta atividade salva. Atualize o Histórico de atividades e tente novamente.",
  "The activity could not be added to Calendar. Review the current state.":
    "Não foi possível adicionar a atividade ao Calendário. Revise o estado atual.",
  "This saved activity is no longer available for this account.":
    "Esta atividade salva não está mais disponível para esta conta.",
  "This review expired. Close and resume it from Activity History.":
    "Esta revisão expirou. Feche e retome pelo Histórico de atividades.",
  "This review expired. Review the refreshed details before confirming again.":
    "Esta revisão expirou. Revise os detalhes atualizados antes de confirmar novamente.",
  "Calendar changed after this review opened. Review the current placement.":
    "O Calendário mudou depois que esta revisão foi aberta. Revise o posicionamento atual.",
  "This activity is saved, but the current Calendar target is not eligible.":
    "Esta atividade está salva, mas o destino atual no Calendário não é elegível.",
  "This activity or Calendar date is already associated elsewhere.":
    "Esta atividade ou data do Calendário já está associada em outro lugar.",
  "The activity was not added to Calendar. Try confirming again.":
    "A atividade não foi adicionada ao Calendário. Tente confirmar novamente.",
  "{title} plot scroll region": "{title}: região rolável do gráfico",
  "{title} data table": "Tabela de dados de {title}",
  "{title}, {period}, {startDate} to {endDate}": "{title}, {period}, de {startDate} a {endDate}",
} as const;

export type HitoProductMessageKey = keyof typeof HITO_PRODUCT_MESSAGES_PT_BR;

export function getHitoProductMessage(
  locale: ResolvedUiLocale,
  key: HitoProductMessageKey,
): string {
  return locale === "pt-BR" ? HITO_PRODUCT_MESSAGES_PT_BR[key] : key;
}

export function getHitoKnownProductMessage(locale: ResolvedUiLocale, value: string): string {
  if (locale !== "pt-BR") return value;
  if (Object.prototype.hasOwnProperty.call(HITO_PRODUCT_MESSAGES_PT_BR, value)) {
    return HITO_PRODUCT_MESSAGES_PT_BR[value as HitoProductMessageKey];
  }

  const chooseGoal = value.match(/^Choose (.+) before creating this plan\.$/);
  if (chooseGoal?.[1]) {
    return formatHitoProductMessage(locale, "Choose {goal} before creating this plan.", {
      goal: getHitoKnownProductMessage(locale, chooseGoal[1]),
    });
  }

  const editorPatterns: readonly [RegExp, HitoProductMessageKey][] = [
    [/^(.+) requires positive minutes\.$/, "{label} requires positive minutes."],
    [/^(.+) requires a positive distance\.$/, "{label} requires a positive distance."],
    [/^(.+) requires 2–50 repeats\.$/, "{label} requires 2–50 repeats."],
    [/^(.+) requires a pace value\.$/, "{label} requires a pace value."],
    [/^(.+) requires a heart-rate value\.$/, "{label} requires a heart-rate value."],
    [/^(.+) requires RPE from 0 to 10\.$/, "{label} requires RPE from 0 to 10."],
  ];

  for (const [pattern, key] of editorPatterns) {
    const match = value.match(pattern);
    if (match?.[1]) {
      return formatHitoProductMessage(locale, key, { label: match[1] });
    }
  }

  return value;
}

export function formatHitoProductMessage(
  locale: ResolvedUiLocale,
  key: HitoProductMessageKey,
  values?: Readonly<Record<string, string | number>>,
): string {
  const message = getHitoProductMessage(locale, key);
  if (!values) return message;

  return message.replace(/\{([a-zA-Z0-9]+)\}/g, (token, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : token,
  );
}

export function getHitoProductApiFailureMessage(
  locale: ResolvedUiLocale,
  failure: HitoProductApiFailure,
): string {
  switch (failure.code) {
    case "avatar_file_required":
      return getHitoProductMessage(locale, "Choose an avatar image before uploading.");
    case "avatar_file_empty":
      return getHitoProductMessage(locale, "Choose a non-empty avatar image.");
    case "avatar_file_too_large":
      return formatHitoProductMessage(locale, "Choose an avatar image under {maxSizeMb} MB.", {
        maxSizeMb: formatApiFileSizeMegabytes(failure.params.maxBytes, locale),
      });
    case "avatar_file_type_unsupported":
      return formatHitoProductMessage(
        locale,
        "Use one of these avatar file types: {allowedMimeTypes}.",
        { allowedMimeTypes: failure.params.allowedMimeTypes.join(", ") },
      );
    case "avatar_profile_required":
      return getHitoProductMessage(locale, "Finish setup before uploading an avatar.");
    case "avatar_auth_required":
      return getHitoProductMessage(locale, "Sign in again before changing your avatar.");
    case "avatar_upload_failed":
      return getHitoProductMessage(locale, "The avatar could not be uploaded. Try again shortly.");
    case "runner_activity_auth_required": {
      const operation = failure.params.operation;
      switch (operation) {
        case "history_read":
          return getHitoProductMessage(locale, "Sign in again before opening activity history.");
        case "progress_read":
          return getHitoProductMessage(locale, "Sign in again before opening running progress.");
        case "delete":
          return getHitoProductMessage(locale, "Sign in again before deleting activity history.");
        case "source_remove":
          return getHitoProductMessage(
            locale,
            "Sign in again before removing the original activity file.",
          );
      }
      return assertUnreachableProductApiParameter(operation);
    }
    case "runner_activity_history_request_invalid":
      return getHitoProductMessage(locale, "Refresh activity history and try again.");
    case "runner_activity_history_unavailable":
      return getHitoProductMessage(
        locale,
        "We could not load activity history. Try again shortly.",
      );
    case "runner_activity_progress_period_invalid":
      return formatHitoProductMessage(
        locale,
        "The progress period {period} is not available. Choose another period.",
        { period: failure.params.period },
      );
    case "runner_activity_progress_unavailable":
      return getHitoProductMessage(
        locale,
        "We could not load running progress. Try again shortly.",
      );
    case "runner_activity_not_found":
      return getHitoProductMessage(
        locale,
        failure.params.operation === "delete"
          ? "This activity is no longer available to delete."
          : "This activity is no longer available for file removal.",
      );
    case "runner_activity_delete_failed":
      return getHitoProductMessage(
        locale,
        "We could not delete this activity history. Try again shortly.",
      );
    case "runner_activity_source_remove_failed":
      return getHitoProductMessage(
        locale,
        "We could not remove the original file. Try again shortly.",
      );
    case "workout_result_auth_required":
      return getHitoProductMessage(
        locale,
        failure.params.operation === "upload"
          ? "Sign in again before uploading a Garmin result file."
          : "Sign in again before changing Garmin evidence.",
      );
    case "workout_result_invalid_request":
      return getHitoProductMessage(
        locale,
        failure.params.operation === "upload"
          ? "Choose a Garmin .fit file or a .zip archive before uploading."
          : "Choose a workout before removing its Garmin evidence.",
      );
    case "workout_result_file_type_unsupported":
      return formatHitoProductMessage(
        locale,
        "Only these activity file types are supported: {acceptedKinds}.",
        {
          acceptedKinds: failure.params.acceptedKinds.map((kind) => kind.toUpperCase()).join(", "),
        },
      );
    case "workout_result_file_too_large":
      return formatHitoProductMessage(locale, "Choose an activity file under {maxSizeMb} MB.", {
        maxSizeMb: formatApiFileSizeMegabytes(failure.params.maxBytes, locale),
      });
    case "workout_result_workout_unavailable":
      return getHitoProductMessage(
        locale,
        failure.params.operation === "upload"
          ? "That workout is no longer available for activity upload."
          : "That workout is no longer available for evidence removal.",
      );
    case "workout_result_rest_day_unsupported":
      return getHitoProductMessage(
        locale,
        "Activity evidence can only be attached to a running workout.",
      );
    case "workout_result_archive_activity_missing":
      return getHitoProductMessage(locale, "This archive does not contain a usable activity file.");
    case "workout_result_archive_multiple_activities":
      return formatHitoProductMessage(
        locale,
        "This archive contains more than {maxActivities} activity file. Upload one activity only.",
        { maxActivities: failure.params.maxActivities },
      );
    case "workout_result_file_unreadable":
      return getHitoProductMessage(
        locale,
        "We could not read that activity file. Choose the original file and try again.",
      );
    case "workout_result_activity_already_recorded":
      return getHitoProductMessage(
        locale,
        "This activity is already attached to another workout. Choose the matching workout instead.",
      );
    case "workout_result_storage_failed":
      return getHitoProductMessage(
        locale,
        failure.params.operation === "upload"
          ? "We could not store that activity file. Try again shortly."
          : "We could not remove the stored activity file. Try again shortly.",
      );
    case "workout_result_persistence_failed":
      return getHitoProductMessage(
        locale,
        failure.params.operation === "upload"
          ? "The activity result could not be saved. The workout is unchanged."
          : "The activity evidence could not be removed. Try again shortly.",
      );
  }
}

function formatApiFileSizeMegabytes(bytes: number, locale: ResolvedUiLocale): string {
  return formatUiNumber(bytes / (1024 * 1024), locale, { maximumFractionDigits: 1 });
}

function assertUnreachableProductApiParameter(value: never): never {
  throw new Error(`Unreachable product API parameter: ${String(value)}`);
}
