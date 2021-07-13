#A tool for getting ACS data and estimating percentages
#Organization: BoSY

#Load packages
library(tidyverse)
library(tidycensus)
library(sf)
library(geojsonio)

#Load your Census API Key
##For first time use, request a key via: https://api.census.gov/data/key_signup.html 
#Run the next line with your key in "..."
#census_api_key("...", install = TRUE)


#define variables - ACS 2019 5-year estimates
#define variables to be extracted
# acs_vars <- load_variables(2019,"acs5",cache=TRUE)
# acs_vars_p <- load_variables(2019,"acs5/profile",cache=TRUE)
# acs_vars_s <- load_variables(2019,"acs5/subject",cache=TRUE)

#tract level
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

vars_acs_ct <- get_acs(geography = "tract",
                        variables = vars,
                        state = "CA",
                        county = "Los Angeles County",
                        year = 2019) %>%
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
               rename(Uninsured_per = S2701_C05_001,
                      Pop_total = B03002_001) %>% 
               select(GEOID, 
                      Pop_total,
                      Limited_Eng_per,
                      Poverty_per, 
                      Uninsured_per,
                      NonHisp_asian_per,
                      NonHisp_pi_per,
                      NonHisp_black_per,
                      NonHisp_white_per,
                      Hisp_per,
                      NonHisp_ai_per)

write.csv(vars_acs_ct, "./acs_vars_tracts.csv")

#block group level
vars1 <- c("B16004_001",#population (age 5+) for ability to speak english
           "B16004_007",#Spanish, "not well" English & age 5-17
           "B16004_008",#Spanish, "not at all" English & age 5-17
           "B16004_012",#Indo-European, "not well" English & age 5-17
           "B16004_013",#Indo-European, "not at all" English & age 5-17
           "B16004_017",#Asian & PI, "not well" English & age 5-17
           "B16004_018",#Asian & PI, "not at all" English & age 5-17
           "B16004_022",#Other, "not well" English & age 5-17
           "B16004_023",#Other, "not at all" English & age 5-17
           "B16004_029",#Spanish, "not well" English & age 18-64
           "B16004_030",#Spanish, "not at all" English & age 18-64
           "B16004_034",#Indo-European, "not well" English & age 18-64
           "B16004_035",#Indo-European, "not at all" English & age 18-64
           "B16004_039",#Asian & PI, "not well" English & age 18-64
           "B16004_040",#Asian & PI, "not at all" English & age 18-64
           "B16004_044",#Other, "not well" English & age 18-64
           "B16004_045",#Other, "not at all" English & age 18-64
           "B16004_051",#Spanish, "not well" English & age 65+
           "B16004_052",#Spanish, "not at all" English & age 65+
           "B16004_056",#Indo-European, "not well" English & age 65+
           "B16004_057",#Indo-European, "not at all" English & age 65+
           "B16004_061",#Asian & PI, "not well" English & age 65+
           "B16004_062",#Asian & PI, "not at all" English & age 65+
           "B16004_066",#Other, "not well" English & age 65+
           "B16004_067",#Other, "not at all" English & age 65+
           "B17021_001",#population for whom poverty status is determined
           "B17021_002",#Below 100 percent of the poverty level
           "B27010_001",#Civilian noninstitutionalized population for health coverage
           "B27010_017",#uninsured & age 0-18
           "B27010_033",#uninsured & age 19-34
           "B27010_050",#uninsured & age 35-64
           "B27010_066",#uninsured & age 65+
           "B03002_001",#total population
           "B03002_006",#Asian
           "B03002_007",#Native Hawaiian and Other PI
           "B03002_004",#Black
           "B03002_003",#Non-Hispanic White
           "B03002_012",#Hispanic or Latino 
           "B03002_005",#American Indian and Alaska Native
           "B01001_002",#male
           "B01001_003",#male5
           "B01001_004",#male5-9
           "B01001_005",#male10-14
           "B01001_006",#male15-17
           "B01001_007",#male18-19
           "B01001_008",#male20
           "B01001_009",#male21
           "B01001_010",#male22-24
           "B01001_011",#male25-29
           "B01001_012",#male30-34
           "B01001_013",#male35-39
           "B01001_014",#male40-44
           "B01001_015",#male45-49
           "B01001_016",#male50-54
           "B01001_017",#male55-59
           "B01001_018",#male60-61
           "B01001_019",#male62-64
           "B01001_020",#male65-66
           "B01001_021",#male67-69
           "B01001_022",#male70-74
           "B01001_023",#male75-79
           "B01001_024",#male80-84
           "B01001_025",#male85
           "B01001_026",#female
           "B01001_027",#female5
           "B01001_028",#female5-9
           "B01001_029",#female10-14
           "B01001_030",#female15-17
           "B01001_031",#female18-19
           "B01001_032",#female20
           "B01001_033",#female21
           "B01001_034",#female22-24
           "B01001_035",#female25-29
           "B01001_036",#female30-34
           "B01001_037",#female35-39
           "B01001_038",#female40-44
           "B01001_039",#female45-49
           "B01001_040",#female50-54
           "B01001_041",#female55-59
           "B01001_042",#female60-61
           "B01001_043",#female62-64
           "B01001_044",#female65-66
           "B01001_045",#female67-69
           "B01001_046",#female70-74
           "B01001_047",#female75-79
           "B01001_048",#female80-84
           "B01001_049")#female85

vars_acs_bg <- get_acs(geography = "block group",
                       variables = vars1,
                       state = "CA",
                       county = "Los Angeles County",
                       year = 2019,
                       output = "wide") %>%
               mutate(Limited_Eng_per = (B16004_007E + B16004_008E +
                                         B16004_012E + B16004_013E +
                                         B16004_017E + B16004_018E +
                                         B16004_022E + B16004_023E +
                                         B16004_029E + B16004_030E +
                                         B16004_034E + B16004_035E +
                                         B16004_039E + B16004_040E +
                                         B16004_044E + B16004_045E +
                                         B16004_051E + B16004_052E +
                                         B16004_056E + B16004_057E +
                                         B16004_061E + B16004_062E +
                                         B16004_066E + B16004_067E) / B16004_001E * 100,
                      Poverty_per = B17021_002E / B17021_001E * 100, 
                      Uninsured_per = (B27010_017E + B27010_033E + B27010_050E + B27010_066E) / B27010_001E * 100, 
                      NonHisp_asian_per = B03002_006E/B03002_001E * 100,
                      NonHisp_pi_per = B03002_007E/B03002_001E * 100,
                      NonHisp_black_per = B03002_004E/B03002_001E * 100,
                      NonHisp_white_per = B03002_003E/B03002_001E * 100,
                      Hisp_per = B03002_012E/B03002_001E * 100,
                      NonHisp_ai_per = B03002_005E/B03002_001E * 100,
                      Male_per = B01001_002E/B03002_001E * 100,
                      Female_per = B01001_026E/B03002_001E * 100,
                      Age_5under_per = (B01001_003E + B01001_027E)/B03002_001E * 100,
                      Age_5to14_per = (B01001_004E + B01001_005E  + 
                                       B01001_028E + B01001_029E)/B03002_001E * 100,
                      Age_15to17_per = (B01001_006E + B01001_030E)/B03002_001E * 100,
                      Age_18to20_per = (B01001_007E + B01001_008E + 
                                        B01001_031E + B01001_032E)/B03002_001E * 100,
                      Age_21to64_per = (B01001_009E + B01001_010E + B01001_011E +
                                        B01001_012E + B01001_013E + B01001_014E +
                                        B01001_015E + B01001_016E + B01001_017E +
                                        B01001_018E + B01001_019E + B01001_033E +
                                        B01001_034E + B01001_035E + B01001_036E +
                                        B01001_037E + B01001_038E + B01001_039E +
                                        B01001_040E + B01001_041E + B01001_042E +
                                        B01001_043E)/B03002_001E * 100,
                      Age_65above_per = (B01001_020E + B01001_021E + B01001_022E +
                                         B01001_023E + B01001_024E + B01001_025E +
                                         B01001_044E + B01001_045E + B01001_046E +
                                         B01001_047E + B01001_048E + B01001_049E)/B03002_001E * 100
               ) %>% 
               rename(Pop_total = B03002_001E) %>% 
               select(GEOID, 
                      Pop_total,
                      Limited_Eng_per,
                      Poverty_per, 
                      Uninsured_per,
                      NonHisp_asian_per,
                      NonHisp_pi_per,
                      NonHisp_black_per,
                      NonHisp_white_per,
                      Hisp_per,
                      NonHisp_ai_per,
                      Male_per,
                      Female_per,
                      Age_5under_per,
                      Age_5to14_per,
                      Age_15to17_per,
                      Age_18to20_per,
                      Age_21to64_per,
                      Age_65above_per
                      )

write.csv(vars_acs_bg, "./web/data/bg_results/acs_vars_blockgroups_new.csv", row.names=FALSE)

#block group level - raw data
acs_bg_raw <- get_acs(geography = "block group",
                       variables = vars1,
                       state = "CA",
                       county = "Los Angeles County",
                       year = 2019,
                       output = "wide") %>%
              select(-NAME)

write.csv(acs_bg_raw, "./web/data/bg_results/acs_blockgroups.csv", row.names=FALSE)


#get boundary shapefiles from census.gov
bg_source <- "https://www2.census.gov/geo/tiger/GENZ2019/shp/cb_2019_06_bg_500k.zip"
bg_path <- "Bo/GIS/cb_2019_06_bg_500k.shp"

#download file only if not already in directory
if (file.exists(bg_path) == FALSE) {
  download.file(url = bg_source,
                destfile = "Bo/cb_2019_06_bg_500k.zip")
  unzip("Bo/cb_2019_06_bg_500k.zip",
        exdir = "Bo/GIS")
  file.remove("Bo/cb_2019_06_bg_500k.zip")
}

## read census tract file
bg_lacounty <- st_read(bg_path) %>% 
               st_transform(4326) %>% 
               filter(COUNTYFP == "037") %>% 
               select(GEOID, ALAND)

st_write(bg_lacounty, "./web/data/boundary files/bg.geojson")
#topojson_write(bg_lacounty, "./web/data/boundary files/bg.topojson")
