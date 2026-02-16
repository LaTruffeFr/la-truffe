export interface MockVehicle {
  id: string;
  title: string;
  price: number;
  mileage: number;
  year: number;
  image_url: string;
  truffe_score: number;
  is_verified: boolean;
  fuel: string;
  transmission: string;
  brand: string;
  model: string;
  link: string;
}

export const mockVehicles: MockVehicle[] = [
  { id: "1", title: "Clio 4 dCi 90 Intens", price: 11900, mileage: 45000, year: 2018, image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBh6UDzDeuOnjkDIgPbVJAvsxxeXdzDyu1zKj4pO-maOnEt92A6TsndPPTTb57CDnAd9aaquc5C4Q_INSbMOYGTFi8rjIghl_XIyGmwzSRjeaIIMWYKZjqT23usYNb3koRVAd_wKUBom4BnG-cv7WjD_5rCazKr-2UQjLai4rm9X-f-2CxxlGkImPQSKKSxLlDScPy-hf8kvC1JlG6tD3cgRnoErHj_2cJJhQR_rLdj5nTKp2F70LH3siqwao82ZN4TTRw30F7OFCw", truffe_score: 9.8, is_verified: true, fuel: "Diesel", transmission: "Manuelle", brand: "Renault", model: "Clio 4", link: "#" },
  { id: "2", title: "Clio 4 TCe 90 Zen", price: 10500, mileage: 62000, year: 2017, image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBAKJ8F19l_vqc12sxWl0oY2blbwP6oK58WEd9zWNMNxjOxKluVPlhNuLP1Wlr2FiwgEu6C5sM1NtmurmxPSrNy-ykuUiYEMIlBfiHsw9ynlZcfOUsrQTHmCvIymRl7S-1zQa0qJuqgBMAuMibsOAwgDwhpu6z7kPbfytaD6weyyPBcV3rrU55niNx6tehkIrbtJDPkkrx67cs83pJLGAQHS7F28i3c_DhVO4bQySW3xCApm_bX7eO41ShfQiHSa0ZoqK3BWLaionU", truffe_score: 9.2, is_verified: false, fuel: "Essence", transmission: "Auto", brand: "Renault", model: "Clio 4", link: "#" },
  { id: "3", title: "Clio 4 Life 1.2", price: 9200, mileage: 85000, year: 2016, image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuA3LY8EAQmlAD5xwt7rgyXxuIekUERxaD5jm2NZuCC_IZFYFMSp3aIuzVDHyJXs04CGpGGNg12VdxKDfM92KB7YM5wxhOT8Fx8LtTcxWy3PygbbyTvdC-Ny3V7R492l9mZfcxcCGpuTgAspew6P44TbJiG32of73a7Fu2jJqEvRAUWUMQa0zIoBGMo3ovfkD2hthLbWYpEm4S27w7WVBKGpHF3rg6O6ZUbZZpu4NwsqexPgQv_uv6jw7GCsiI1uBMNSJ1swaVk6q_0", truffe_score: 7.5, is_verified: false, fuel: "Essence", transmission: "Manuelle", brand: "Renault", model: "Clio 4", link: "#" },
  { id: "4", title: "Audi A3 Sportback S-line", price: 24500, mileage: 45000, year: 2021, image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDd-AyyyR-ATBPLsc5sqxyT7dfSJE0cKkGoaLEfRtlqnYaPxUc7BWTSUexvr67GgmqctOdyPSPuniAivAWcDpVE6VEimesxEyQ5801urjomQN1N-Z_H394VHJbeQ3YK9lGBnxQCVRr9cAwg_c4CQFxSv6p3NLckZrIpKEnx-AiJmdgb5PSraMLSeHUbA02YD3tTkJLEyj6hiOsDeandW1rU4BPYT0W9oVK6O0YAwbhz9wt0el20Nji_lslMDx7zVKm6575enpP0GmY", truffe_score: 9.2, is_verified: true, fuel: "Diesel", transmission: "Auto", brand: "Audi", model: "A3", link: "#" },
  { id: "5", title: "Renault Clio V Intens", price: 14200, mileage: 32000, year: 2020, image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBVoTFSoRgCf6ijylHCa4rD4UK2SV9JL2FUp50du7lasMhexE0X9DtRlriXxYhl-1-Wj2QxO2lq3kWn8IWvbtGxrnpbIG6zsAM3pBqR6groMFxAmBNgAVhu0NlmYFYuCdJoDem1PGsb8zqBLOnoQxdtBlW9jUhV0GWtvNBnTWHJ_RzwUBpuFXM1o8HayMxez7E8QCJFDMfa2acxn4XH55FX2JF-_cPrvFubkskV8aTswcV1uv6_ZZqlqhm0YeYsCZ2L_USYiejP-3I", truffe_score: 8.8, is_verified: true, fuel: "Essence", transmission: "Manuelle", brand: "Renault", model: "Clio V", link: "#" },
  { id: "6", title: "BMW Série 3 320d Sport", price: 27800, mileage: 68000, year: 2019, image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDP5KH8pWJaZdmowoiASKCc_7KxqjGtgbD1wXZI61ht6Xx6I3ymvRWVFqOI5QGl95PKnmRfGbhpXiHyuEgP9xNpE_ge9PRJucfx3G_UeWSq-yjMlEghSoOCEsOgxAN1oVEHvDx43YcRZiDKWjPsWeelrCGPsCBFuWYlS9AIDCtKINZMdNTGI-6b11M7MjAFg0_ASuXp7bm11p1vt-Z5gmjB_pjWjEvE5PlgYvt9gm8MP9HgwcEBQTK21osnlelZiVfe1DCMVeqI8nY", truffe_score: 9.5, is_verified: false, fuel: "Diesel", transmission: "Auto", brand: "BMW", model: "Série 3", link: "#" },
  { id: "7", title: "Audi RS3 Sportback", price: 48500, mileage: 28000, year: 2020, image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuA8rqemukaCQrF1BxOYU9x_3UErtphBzPSSoVb64eMDJ7Cnz0OPRRzEoZ50ELM71PA5TzwGaJoXEXmMvwr_JNTrRPuQDqp_Le0V069ECHAyd9Tv1DbVC4QHWr_U4jmvaOU7a2_p6GwLl99sxP51b4R84d4_1aW0iBwX9BK4RJWvdbwjhFP0FRtqWR8UQ0hd0HjF8RN7Fr6iBSHTPhkN7Et3mU9rZuTi4c2baC38_64NsRBj8Ow5Kv2Tq2mVfprBS3pxuALtZvSuBH8", truffe_score: 8.4, is_verified: true, fuel: "Essence", transmission: "Auto", brand: "Audi", model: "RS3", link: "#" },
  { id: "8", title: "Clio 4 Energy dCi 75", price: 7800, mileage: 120000, year: 2015, image_url: "", truffe_score: 6.2, is_verified: false, fuel: "Diesel", transmission: "Manuelle", brand: "Renault", model: "Clio 4", link: "#" },
  { id: "9", title: "Peugeot 308 GT Line", price: 18900, mileage: 55000, year: 2019, image_url: "", truffe_score: 8.1, is_verified: true, fuel: "Diesel", transmission: "Auto", brand: "Peugeot", model: "308", link: "#" },
  { id: "10", title: "Mercedes Classe A 200d", price: 26500, mileage: 42000, year: 2020, image_url: "", truffe_score: 7.9, is_verified: true, fuel: "Diesel", transmission: "Auto", brand: "Mercedes", model: "Classe A", link: "#" },
  { id: "11", title: "Clio 4 RS Trophy", price: 22000, mileage: 35000, year: 2018, image_url: "", truffe_score: 9.0, is_verified: false, fuel: "Essence", transmission: "Auto", brand: "Renault", model: "Clio 4", link: "#" },
  { id: "12", title: "Audi A1 Sportback", price: 16800, mileage: 38000, year: 2019, image_url: "", truffe_score: 7.8, is_verified: true, fuel: "Essence", transmission: "Manuelle", brand: "Audi", model: "A1", link: "#" },
  { id: "13", title: "BMW X1 xDrive 18d", price: 23500, mileage: 72000, year: 2018, image_url: "", truffe_score: 8.6, is_verified: false, fuel: "Diesel", transmission: "Auto", brand: "BMW", model: "X1", link: "#" },
  { id: "14", title: "Clio 4 Estate dCi 90", price: 10200, mileage: 78000, year: 2017, image_url: "", truffe_score: 8.3, is_verified: true, fuel: "Diesel", transmission: "Manuelle", brand: "Renault", model: "Clio 4", link: "#" },
  { id: "15", title: "Peugeot 2008 Allure", price: 15600, mileage: 48000, year: 2019, image_url: "", truffe_score: 7.4, is_verified: false, fuel: "Essence", transmission: "Manuelle", brand: "Peugeot", model: "2008", link: "#" },
  { id: "16", title: "Clio 4 Initiale Paris", price: 13500, mileage: 52000, year: 2018, image_url: "", truffe_score: 8.7, is_verified: true, fuel: "Diesel", transmission: "Auto", brand: "Renault", model: "Clio 4", link: "#" },
  { id: "17", title: "VW Golf 7 GTI", price: 25900, mileage: 58000, year: 2018, image_url: "", truffe_score: 8.9, is_verified: false, fuel: "Essence", transmission: "Auto", brand: "Volkswagen", model: "Golf", link: "#" },
  { id: "18", title: "Renault Captur Zen", price: 12800, mileage: 65000, year: 2017, image_url: "", truffe_score: 7.1, is_verified: true, fuel: "Essence", transmission: "Manuelle", brand: "Renault", model: "Captur", link: "#" },
  { id: "19", title: "Audi Q3 35 TDI S-line", price: 32000, mileage: 35000, year: 2020, image_url: "", truffe_score: 8.5, is_verified: true, fuel: "Diesel", transmission: "Auto", brand: "Audi", model: "Q3", link: "#" },
  { id: "20", title: "Clio 4 GT-Line TCe 120", price: 12200, mileage: 55000, year: 2017, image_url: "", truffe_score: 8.0, is_verified: false, fuel: "Essence", transmission: "Auto", brand: "Renault", model: "Clio 4", link: "#" },
];

export const mockMarketStats = {
  avgPrice: 12450,
  avgMileage: 65000,
  truffeScore: 8.2,
  totalListings: 342,
  goodDeals: 12,
};
