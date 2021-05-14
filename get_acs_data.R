#A tool for getting ACS data and estimating percentages
#Organization: BoSY

#Load packages
library(tidyverse)
library(tidycensus)

#Load your Census API Key
##For first time use, request a key via: https://api.census.gov/data/key_signup.html 
#Run the next line with your key in "..."
#census_api_key("...", install = TRUE)


#define variables - ACS 2019 5-year estimates
#define variables to be extracted
# acs_vars <- load_variables(2019,"acs5",cache=TRUE)
# acs_vars_p <- load_variables(2019,"acs5/profile",cache=TRUE)
# acs_vars_s <- load_variables(2019,"acs5/subject",cache=TRUE)

vars <- c("B06007_001",#population (age 5+) for ability to speak english
          "B06007_005",#Spanish & limited English
          "B06007_008",#Other languages & limited English
          "B06012_001",#population for whom poverty status is determined
          "B06012_002",#Below 100 percent of the poverty level
          "S2701_C05_001",#percent uninsured
          "B03002_001",#total population
          "B03002_006",#Asian
          "B03002_007",#Native Hawaiian and Other PI
          "B03002_004",#Black
          "B03002_003",#Non-Hispanic White
          "B03002_012",#Hispanic or Latino 
          "B03002_005"#American Indian and Alaska Native
          )

vars_acs <- get_acs(geography = "tract",
                        variables = vars,
                        state = "CA",
                        year = 2019) %>%
            filter(substr(GEOID,3,5) == "037") %>%
            select(-c(NAME, moe)) %>%
            pivot_wider(names_from = variable, values_from = estimate) %>%
            mutate(Limited_Eng_per = (B06007_005 + B06007_008) / B06007_001 * 100,
                   Poverty_per = B06012_002 / B06012_001 * 100, 
                   NonHisp_asian_per = B03002_006/B03002_001 * 100,
                   NonHisp_pi_per = B03002_007/B03002_001 * 100,
                   NonHisp_black_per = B03002_004/B03002_001 * 100,
                   NonHisp_white_per = B03002_003/B03002_001 * 100,
                   Hisp_per = B03002_012/B03002_001 * 100,
                   NonHisp_ai_per = B03002_005/B03002_001 * 100
            ) %>% 
            rename(Uninsured_per = S2701_C05_001) %>% 
            select(GEOID, 
                   Limited_Eng_per,
                   Poverty_per, 
                   Uninsured_per,
                   NonHisp_asian_per,
                   NonHisp_pi_per,
                   NonHisp_black_per,
                   NonHisp_white_per,
                   Hisp_per,
                   NonHisp_ai_per)

write.csv(vars_acs, "./acs_vars_results.csv")