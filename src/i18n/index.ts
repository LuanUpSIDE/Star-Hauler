const translations = {
  en: {
    // Game/UI
    game_title: 'Space Hauler Gemini',
    close: 'Close',

    // Main Menu & Options
    main_menu: {
      continue_game: 'Continue Game',
      new_game: 'New Game',
      options: 'Options',
      new_game_confirm: 'This will overwrite your existing save data. Are you sure?',
    },
    options_panel: {
      title: 'Options',
      language: 'Language',
      back: 'Back',
    },
    languages: {
      en: 'English',
      'pt-br': 'Português (BR)',
    },

    // Pause Menu
    pause_menu: {
        title: 'Paused',
        resume: 'Resume Game',
        save: 'Save Game',
        exit: 'Exit to Main Menu',
    },

    // Overlays
    loading: 'GENERATING UNIVERSE...',
    in_transit: 'IN TRANSIT...',
    approaching: 'Approaching', // e.g. Approaching Xylo Prime

    // Status Bar
    manifest_button: 'Manifest',
    pause_button: 'Pause (P)',

    // Planet Panel
    planet_panel: {
      refueling_station: 'Refueling Station',
      tank: 'Tank',
      fill_tank: 'Fill Tank ({cost} C)',
      hauling_contracts: 'Hauling Contracts',
      no_contracts: 'No contracts available.',
      accept: 'Accept',
      shipyard: 'Shipyard',
      buy: 'Buy',
      empty_cargo_to_buy: 'Empty cargo hold to buy a new ship.',
      hangar: 'Hangar',
      activate: 'Activate',
      no_other_ships: 'No other ships in hangar.',
      empty_cargo_to_switch: 'Empty cargo hold to switch ships.',
      travel_computer: 'Travel Computer',
      distance: 'Distance',
      units: 'units',
      fuel_required: 'Fuel Required',
      gravity_well_note: 'Note: Route avoids gravity well.',
      travel_directly: 'Travel Directly',
      add_to_route: 'Add to Route',
    },

    // Manifest Panel
    manifest_panel: {
      title: 'Cargo Manifest',
      to: 'To',
      reward: 'Reward',
      cancel_contract: 'Cancel (-{penalty} C)',
      empty_hold: 'Cargo hold is empty.',
    },
    
    // Route Panel
    route_panel: {
      title: 'Planned Route',
      continue: 'Continue',
      clear: 'Clear',
      remove_from_route_aria: 'Remove {planetName} from route',
      remove_from_route_title: 'Remove {planetName}',
    },

    // Toasts (Notifications)
    toast: {
      controller_connected: 'Controller connected',
      controller_disconnected: 'Controller disconnected',
      arrived_at: 'Arrived at {planetName}.',
      contracts_completed: 'Contracts completed! +{credits} C',
      not_enough_cargo: 'Not enough cargo space.',
      contract_accepted: 'Contract accepted!',
      contract_cancelled: 'Contract cancelled. -{penalty} C',
      insufficient_credits_fuel: 'Insufficient credits for fuel.',
      refueled: 'Refueled +{amount} units.',
      cannot_buy_ship: 'Cannot buy ship. Check credits or empty cargo hold.',
      ship_purchased: 'Purchased {shipName}!',
      empty_cargo_to_switch_ships: 'Empty your cargo hold before switching ships.',
      ship_activated: 'Activated {shipName}.',
      insufficient_fuel: 'Insufficient fuel for travel.',
      destination_added_to_route: 'Destination added to route.',
      destination_removed_from_route: 'Destination removed from route.',
      game_saved: 'Game Saved!',
    },
    
    // Planet Descriptions
    mining_desc_1: "A barren rock, rich in valuable ores.",
    mining_desc_2: "Its surface is scarred by massive mining operations.",
    mining_desc_3: "Known for its vast deposits of heavy metals.",
    industrial_desc_1: "A world shrouded in smog and industry.",
    industrial_desc_2: "Towering factories dominate the skyline.",
    industrial_desc_3: "The industrial heart of the sector, producing vital components.",
    technological_desc_1: "Gleaming cityscapes and advanced research labs.",
    technological_desc_2: "A hub of innovation and technological marvels.",
    technological_desc_3: "Home to the brightest minds and most advanced AI.",
    agricultural_desc_1: "Lush, green fields cover this terrestrial world.",
    agricultural_desc_2: "The breadbasket of the system.",
    agricultural_desc_3: "Vast hydroponic farms feed millions across the stars.",
    refinery_desc_1: "Massive refineries process raw materials day and night.",
    refinery_desc_2: "The air smells of ozone and processed fuel.",
    refinery_desc_3: "A critical link in the sector's supply chain.",
    
    // StarMap controls aria-labels
    starmap: {
      zoom_in: 'Zoom In',
      zoom_out: 'Zoom Out',
      reset_view: 'Reset View',
    }
  },
  'pt-br': {
    game_title: 'Space Hauler Gemini', // Title usually stays in English
    close: 'Fechar',

    main_menu: {
      continue_game: 'Continuar Jogo',
      new_game: 'Novo Jogo',
      options: 'Opções',
      new_game_confirm: 'Isso irá sobrescrever seus dados salvos. Tem certeza?',
    },
    options_panel: {
      title: 'Opções',
      language: 'Idioma',
      back: 'Voltar',
    },
    languages: {
      en: 'English',
      'pt-br': 'Português (BR)',
    },

    pause_menu: {
        title: 'Pausado',
        resume: 'Retomar Jogo',
        save: 'Salvar Jogo',
        exit: 'Sair para o Menu Principal',
    },

    loading: 'GERANDO UNIVERSO...',
    in_transit: 'EM TRÂNSITO...',
    approaching: 'Aproximando-se de',

    manifest_button: 'Manifesto',
    pause_button: 'Pausar (P)',

    planet_panel: {
      refueling_station: 'Posto de Abastecimento',
      tank: 'Tanque',
      fill_tank: 'Encher Tanque ({cost} C)',
      hauling_contracts: 'Contratos de Transporte',
      no_contracts: 'Nenhum contrato disponível.',
      accept: 'Aceitar',
      shipyard: 'Estaleiro',
      buy: 'Comprar',
      empty_cargo_to_buy: 'Esvazie o porão de carga para comprar uma nova nave.',
      hangar: 'Hangar',
      activate: 'Ativar',
      no_other_ships: 'Nenhuma outra nave no hangar.',
      empty_cargo_to_switch: 'Esvazie o porão de carga para trocar de nave.',
      travel_computer: 'Computador de Viagem',
      distance: 'Distância',
      units: 'unidades',
      fuel_required: 'Combustível Necessário',
      gravity_well_note: 'Nota: Rota desvia de poço gravitacional.',
      travel_directly: 'Viajar Diretamente',
      add_to_route: 'Adicionar à Rota',
    },

    manifest_panel: {
      title: 'Manifesto de Carga',
      to: 'Para',
      reward: 'Recompensa',
      cancel_contract: 'Cancelar (-{penalty} C)',
      empty_hold: 'Porão de carga vazio.',
    },
    
    route_panel: {
      title: 'Rota Planejada',
      continue: 'Continuar',
      clear: 'Limpar',
      remove_from_route_aria: 'Remover {planetName} da rota',
      remove_from_route_title: 'Remover {planetName}',
    },

    toast: {
      controller_connected: 'Controle conectado',
      controller_disconnected: 'Controle desconectado',
      arrived_at: 'Chegou em {planetName}.',
      contracts_completed: 'Contratos concluídos! +{credits} C',
      not_enough_cargo: 'Espaço de carga insuficiente.',
      contract_accepted: 'Contrato aceito!',
      contract_cancelled: 'Contrato cancelado. -{penalty} C',
      insufficient_credits_fuel: 'Créditos insuficientes para combustível.',
      refueled: 'Reabastecido +{amount} unidades.',
      cannot_buy_ship: 'Não é possível comprar a nave. Verifique seus créditos ou esvazie o porão.',
      ship_purchased: '{shipName} comprada!',
      empty_cargo_to_switch_ships: 'Esvazie seu porão de carga antes de trocar de nave.',
      ship_activated: '{shipName} ativada.',
      insufficient_fuel: 'Combustível insuficiente para a viagem.',
      destination_added_to_route: 'Destino adicionado à rota.',
      destination_removed_from_route: 'Destino removido da rota.',
      game_saved: 'Jogo Salvo!',
    },
    
    mining_desc_1: "Uma rocha estéril, rica em minérios valiosos.",
    mining_desc_2: "Sua superfície é marcada por enormes operações de mineração.",
    mining_desc_3: "Conhecido por seus vastos depósitos de metais pesados.",
    industrial_desc_1: "Um mundo envolto em poluição e indústria.",
    industrial_desc_2: "Fábricas imponentes dominam o horizonte.",
    industrial_desc_3: "O coração industrial do setor, produzindo componentes vitais.",
    technological_desc_1: "Paisagens urbanas reluzentes e laboratórios de pesquisa avançada.",
    technological_desc_2: "Um centro de inovação e maravilhas tecnológicas.",
    technological_desc_3: "Lar das mentes mais brilhantes e da IA mais avançada.",
    agricultural_desc_1: "Campos verdes e exuberantes cobrem este mundo terrestre.",
    agricultural_desc_2: "O celeiro do sistema.",
    agricultural_desc_3: "Vastas fazendas hidropônicas alimentam milhões através das estrelas.",
    refinery_desc_1: "Refinarias massivas processam matérias-primas dia e noite.",
    refinery_desc_2: "O ar cheira a ozônio e combustível processado.",
    refinery_desc_3: "Um elo crítico na cadeia de suprimentos do setor.",
    
    starmap: {
      zoom_in: 'Aproximar Zoom',
      zoom_out: 'Afastar Zoom',
      reset_view: 'Restaurar Visão',
    }
  },
};

export type Language = keyof typeof translations;
// This creates a union type of all keys from the 'en' object.
type TranslationSet = typeof translations['en'];
export type TranslationKey = keyof TranslationSet | { [K in keyof TranslationSet]: TranslationSet[K] extends object ? `${K}.${keyof TranslationSet[K] & string}` : never }[keyof TranslationSet];


const getNestedValue = (obj: any, path: string): string | undefined => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

export const getTranslator = (lang: Language) => {
    const langTranslations = translations[lang] || translations['en'];
    const fallbackTranslations = translations['en'];
    
    return (key: TranslationKey, vars: Record<string, string | number> = {}): string => {
        let translation = getNestedValue(langTranslations, key) || getNestedValue(fallbackTranslations, key) || key;
        
        for (const [varName, varValue] of Object.entries(vars)) {
            translation = translation.replace(`{${varName}}`, String(varValue));
        }

        return translation;
    };
};