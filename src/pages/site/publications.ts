export interface Publication {
  year: number;
  title: string;
  authors: string;
  venue: string;
  href: string;
}

export interface PublicationGroup {
  label: string;
  items: Publication[];
}

const scholar = ( key: string ) =>
  `https://scholar.google.com/citations?user=Us6Zr_YAAAAJ&hl=en&citation_for_view=Us6Zr_YAAAAJ:${ key }`;

export const publicationGroups: PublicationGroup[] = [
  {
    label: "Original research",
    items: [
      {
        year: 2026,
        title: "Prevalence of Escherichia coli isolated from urinary tract infections and their antibiotic susceptibility patterns among patients at a tertiary care hospital",
        authors: "Pokhrel S, Karmacharya A, Sharma D, Kandel R, et al.",
        venue: "Journal of Rapti Academy of Health Sciences, 3(1), 52-58",
        href: scholar( "Zph67rFs4hoC" ),
      },
      {
        year: 2025,
        title: "Facilitators and barriers of implementing the WHO ICOPE care model in Nepal: a clinical perspective",
        authors: "Aryal A, Bhattarai B, Bhattarai S, Kandel R, et al.",
        venue: "The Journal of Aging Research & Lifestyle, 15, 100032",
        href: "https://doi.org/10.1016/j.jarlif.2025.100032",
      },
      {
        year: 2025,
        title: "Association between frailty status and antimicrobial resistance patterns in uropathogens isolated from older people: a cross-sectional study at a tertiary care hospital in Nepal",
        authors: "Kandel R, Pokhrel S, Sharma D, Bhattarai B",
        venue: "Journal of the Indian Academy of Geriatrics, 21(3), 205-209",
        href: scholar( "LkGwnXOMwfcC" ),
      },
      {
        year: 2025,
        title: "Antimicrobial resistance among older patients attending Rapti Academy of Health Sciences: a retrospective study",
        authors: "Kandel R, Pokhrel S, Sharma D",
        venue: "Journal of Rapti Academy of Health Sciences, 2(1), 15-19",
        href: scholar( "YsMSGLbcyi4C" ),
      },
      {
        year: 2025,
        title: "Geriatric syndromes in older people attending geriatric outpatient department in a tertiary care center in western Nepal",
        authors: "Kandel R, Gautam AR, Bhattarai B, Lamichhane B",
        venue: "Journal of Rapti Academy of Health Sciences, 1(2), 26-30",
        href: "https://doi.org/10.70027/jrahs29",
      },
      {
        year: 2024,
        title: "Unveiling the volume and outcomes of upper gastrointestinal endoscopy at a tertiary care center: a descriptive cross-sectional study",
        authors: "Menyangbo S, Panthi J, Neupane A, Shahi D, Kandel R",
        venue: "Journal of Rapti Academy of Health Sciences, 1(2), 53-57",
        href: scholar( "Se3iqnhoufwC" ),
      },
      {
        year: 2023,
        title: "Lung cancer in the older population: interactive effects of angiotensin converting enzyme gene polymorphism (rs 4340 ID) and tobacco addiction in risk assessment",
        authors: "Banerjee J, Gupta A, Agnihotri V, Pradhan R, Kandel R, et al.",
        venue: "Indian Journal of Cancer, 60(1), 12-17",
        href: "https://doi.org/10.4103/ijc.IJC_1082_19",
      },
      {
        year: 2021,
        title: "Implementing and validating a care protocol for older adults with cancer in resource limited settings with a newly developed screening tool",
        authors: "Banerjee J, Behal P, Satapathy S, Kandel R, et al.",
        venue: "Journal of Geriatric Oncology, 12(1), 139-145",
        href: "https://doi.org/10.1016/j.jgo.2020.04.013",
      },
      {
        year: 2021,
        title: "Challenges and determinants in the management of the older patients with cancer: report from a low- and middle-income country",
        authors: "Kandel R, Banerjee J, Saravanan M, Chatterjee P, et al.",
        venue: "Journal of the Indian Academy of Geriatrics, 17(1), 2-8",
        href: scholar( "_FxGoFyzp5QC" ),
      },
      {
        year: 2020,
        title: "Caregiver burden and its correlates among people with Alzheimer's dementia: an exploratory study from Nepal",
        authors: "Kandel R, Sharma P, Singh S",
        venue: "Journal of the Indian Academy of Geriatrics, 16(4), 169-173",
        href: scholar( "hqOjcs7Dif8C" ),
      },
      {
        year: 2020,
        title: "Old age-associated enrichment of peripheral T regulatory cells and altered redox status in pulmonary tuberculosis patients",
        authors: "Namdeo M, Kandel R, Thakur PK, Mohan A, Dey AB, Mitra DK",
        venue: "European Journal of Immunology, 50(8), 1195-1208",
        href: "https://doi.org/10.1002/eji.201948261",
      },
      {
        year: 2018,
        title: "Nordic walking training and nutritional supplementation in pre-frail older Indians: an open-labelled experimental pre-test and post-test pilot study to develop intervention model",
        authors: "Chatterjee P, Kumar P, Kandel R, Madan R, et al.",
        venue: "BMC Geriatrics, 18(1), 212",
        href: "https://doi.org/10.1186/s12877-018-0890-4",
      },
      {
        year: 2014,
        title: "Development of simple diagnostic criteria for frailty syndrome in Indian elderly population",
        authors: "Chatterjee P, Kandel R, Desai G, Chellaiyan VG, Biswas A, Dey AB",
        venue: "International Journal of Medicine and Pharmaceutical Sciences, 4(5), 21-30",
        href: scholar( "roLk4NBRz8UC" ),
      },
      {
        year: 2014,
        title: "Grip strength: an alternative for measuring osteoporosis in elderly",
        authors: "Chatterjee P, Kandel R, Bhatti H, Challyion V, Chowdhury R, et al.",
        venue: "International Journal of Medicine and Pharmaceutical Sciences, 4(2), 91-100",
        href: scholar( "u5HHmVD_uO8C" ),
      },
    ],
  },
  {
    label: "Reviews and book chapters",
    items: [
      {
        year: 2026,
        title: "Geriatric mental health care in Nepal: psychosocial aspects",
        authors: "Sharma P, Thapaliya S, Gautam K, Kandel R",
        venue: "Handbook on Psychosocial Aspects of Geriatric Mental Health Issues, 125-136, Springer",
        href: "https://doi.org/10.1007/978-981-95-2121-0_10",
      },
      {
        year: 2024,
        title: "Nepal's Geriatric Health Strategy 2021-2030: a narrative review",
        authors: "Kandel R",
        venue: "Journal of the Indian Academy of Geriatrics, 20(3), 141-143",
        href: scholar( "u-x6o8ySG0sC" ),
      },
    ],
  },
  {
    label: "Case reports",
    items: [
      {
        year: 2022,
        title: "Challenges of diagnosis and treatment of ANCA associated vasculitis in COVID-19 pandemic: a case report",
        authors: "Sharma P, Sijapati MJ, Gautam S, Kandel R, Simkhada S, Regmi SB",
        venue: "Nepalese Respiratory Journal, 1(1), 11-14",
        href: scholar( "KlAtU1dfN6UC" ),
      },
      {
        year: 2015,
        title: "Unusual presentation of tuberculosis in an elderly male: a case report",
        authors: "Kandel R, Bhattarai B, Maharjan S",
        venue: "Clinical Case Reports, 3(1), 43-45",
        href: "https://doi.org/10.1002/ccr3.144",
      },
      {
        year: 2014,
        title: "Reversible ototoxicity: a rare adverse reaction of liposomal amphotericin-B used for the treatment of antimony-resistant visceral leishmaniasis in an elderly male",
        authors: "Das PC, Kandel R, Sikka K, Dey AB",
        venue: "Clinical Medicine Insights: Case Reports, 7, 63-66",
        href: "https://doi.org/10.4137/CCRep.S15111",
      },
      {
        year: 2014,
        title: "An unexpected cause of orbital apex syndrome in an immune-competent elderly male",
        authors: "Singh H, Kandel R, Nisar S, Das CJ, Dey AB",
        venue: "Oxford Medical Case Reports, 2014(6), 115-117",
        href: "https://doi.org/10.1093/omcr/omu045",
      },
      {
        year: 2014,
        title: "Multiple atypical presentations in a case of multiple myeloma in an elderly female",
        authors: "Kandel R, Nisar S, Desai GR, Chatterjee P, Dey AB",
        venue: "European Geriatric Medicine, 5(5), 334-335",
        href: scholar( "8k81kl-MbHgC" ),
      },
    ],
  },
  {
    label: "Conference abstracts and editorials",
    items: [
      {
        year: 2024,
        title: "Advancing research excellence: announcing the establishment of the Journal of Rapti Academy of Health Sciences",
        authors: "Lamsal DK, Lamichhane B, Bhandari HL, Kandel R",
        venue: "Journal of Rapti Academy of Health Sciences, 1(1), editorial",
        href: scholar( "ufrVoPGSRksC" ),
      },
      {
        year: 2019,
        title: "Impact of Nordic walking training in patients with progressive supranuclear palsy",
        authors: "Kandel R, Bhattarai B",
        venue: "Movement Disorders, 34(Suppl), S892",
        href: scholar( "qjMakFHDy7sC" ),
      },
      {
        year: 2018,
        title: "P2-305: Cognitive status and the outcomes of hip fracture surgery in elderly patients",
        authors: "Kandel R, Bhattarai B, Dahal S",
        venue: "Alzheimer's & Dementia, 14(7S), P799-P800",
        href: scholar( "UeHWp8X0CEIC" ),
      },
      {
        year: 2017,
        title: "The impact of frailty in outcomes of hip fracture surgery in elderly patients",
        authors: "Kandel R, Basnyat S, Dahal S",
        venue: "Innovation in Aging, 1(Suppl), 1129-1130",
        href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6185187/",
      },
      {
        year: 2015,
        title: "The burden of lung cancer and the various factors deciding the treatment of lung cancer in the developing world",
        authors: "Kandel R, Maharjan S, Kayastha G",
        venue: "Journal of Thoracic Oncology, 10(9), S789",
        href: scholar( "d1gkVwhDpl0C" ),
      },
      {
        year: 2014,
        title: "P143: Impact of nutritional supplementation and nordic walking in frail older patients in geriatrics department of tertiary care hospital in India",
        authors: "Kandel R, Chatterjee P, Kumar V, Gopalan V, et al.",
        venue: "European Geriatric Medicine, 5(Suppl), S127-S128",
        href: scholar( "eQOLeE2rZwMC" ),
      },
      {
        year: 2014,
        title: "O4.09: Functional status, comorbidities and their impact on management of older patients with cancer in India",
        authors: "Kandel R, Banerjee J, Thakur S, Kumar V, et al.",
        venue: "European Geriatric Medicine, 5(Suppl), S75",
        href: scholar( "0EnyYjriUFMC" ),
      },
      {
        year: 2014,
        title: "P222: Grip strength: a simple and an alternate tool to bone densitometry (DEXA)",
        authors: "Kandel R, Chatterjee P, Singh H, Chellaiyan VG, Dey AB",
        venue: "European Geriatric Medicine, 5(Suppl), S155",
        href: scholar( "2osOgNQ5qMEC" ),
      },
    ],
  },
];

export const scholarProfileUrl = "https://scholar.google.com/citations?user=Us6Zr_YAAAAJ&hl=en";
export const orcidUrl = "https://orcid.org/0000-0002-7827-1471";
