#!/usr/bin/env python
# coding: utf-8

# In[1]:


#| hide
import pandas as pd


# # Data Collection

# When starting a new project, we'll load all raw data into the `data/raw-data/` directory.  Define the relative path here.

# In[2]:


raw_data = '../data/raw-data'


# All working data will be saved in the `data/working-data/` directory

# In[3]:


working_data = '../data/working-data'


# ## Data
# All of our data
# came from https://av-info.faa.gov/dd_sublevel.asp?Folder=%5CAID,
# which provides text files of flight incident records from 1975-2022
# in five year increments. We then converted the text files to CSV
# files using excel. 

# Lets first import all datasets from our raw data directory

# In[4]:


dataset1 = f'{raw_data}/a1975_79.csv'
dataset2 = f'{raw_data}/a1980_84.csv'
dataset3 = f'{raw_data}/a1985_89.csv'
dataset4 = f'{raw_data}/a1990_94.csv'
dataset5 = f'{raw_data}/a1995_99.csv'
dataset6 = f'{raw_data}/a2000_04.csv'
dataset7 = f'{raw_data}/a2005_09.csv'
dataset8 = f'{raw_data}/a2010_14.csv'
dataset9 = f'{raw_data}/a2015_19.csv'
dataset0 = f'{raw_data}/a2020_25.csv'


# We then convert all daatasets to pandas dataframes

# In[5]:


df1 = pd.read_csv(dataset1, header = 0)
df2 = pd.read_csv(dataset2, header = 0)
df3 = pd.read_csv(dataset3, header = 0)
df4 = pd.read_csv(dataset4, header = 0)
df5 = pd.read_csv(dataset5, header = 0)
df6 = pd.read_csv(dataset6, header = 0)
df7 = pd.read_csv(dataset7, header = 0)
df8 = pd.read_csv(dataset8, header = 0)
df9 = pd.read_csv(dataset9, header = 0)
df0 = pd.read_csv(dataset0, header = 0)


# As you can see, this data is not clean, we'll do that in our next step

# First, concat all data into one dataframe to easlit work with all the data.

# In[6]:


df = pd.concat([df1, df2, df3, df4, df5, df6, df7, df8, df9, df0], ignore_index=True)


# Then, save thte concatenated dataframe to our `working-data/` directory.

# In[7]:


df.to_csv(f'{working_data}/Concatenated_Orig_data.csv')


# In[8]:


df.shape

