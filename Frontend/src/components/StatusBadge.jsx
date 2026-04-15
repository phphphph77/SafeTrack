export default function StatusBadge({ situacao }) {
    const config = {
      valido:          { label: 'Válido',          classes: 'bg-green-100 text-green-800'  },
      vencendo:        { label: 'Vencendo',         classes: 'bg-yellow-100 text-yellow-800' },
      vencido:         { label: 'Vencido',          classes: 'bg-red-100 text-red-800'    },
      sem_certificado: { label: 'Sem Certificado',  classes: 'bg-gray-100 text-gray-600'  },
      pendente:        { label: 'Pendente',          classes: 'bg-blue-100 text-blue-800'  },
      aprovada:        { label: 'Aprovada',          classes: 'bg-green-100 text-green-800' },
      em_execucao:     { label: 'Em Execução',       classes: 'bg-indigo-100 text-indigo-800' },
      concluida:       { label: 'Concluída',         classes: 'bg-teal-100 text-teal-800'  },
      cancelada:       { label: 'Cancelada',         classes: 'bg-red-100 text-red-800'   },
    };
  
    const { label, classes } = config[situacao] || { label: situacao, classes: 'bg-gray-100 text-gray-600' };
  
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}>
        {label}
      </span>
    );
  }