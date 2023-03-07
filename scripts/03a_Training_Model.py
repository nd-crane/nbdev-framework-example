#!/usr/bin/env python
# coding: utf-8

# In[1]:


#| hide
# This notebook is an outline for 10 fold cross validation neural network
# Environment Setup
#! pdm add transformers
#! pdm add datasets
#! pdm add keras==2.6.*
#! pdm add torch==1.8.0 torchtext==0.9.0
#! pdm add torchtext


# In[2]:


#| hide
import sys
sys.path.append('../__pypackages__/3.9/lib/')
print(sys.path)


# # Training Model

# In[3]:


cleaned_data = '../data/processed-data/nn'


# ## Preprocessing

# In[4]:


from sklearn.preprocessing import LabelEncoder
import pandas as pd
from datasets import Dataset,DatasetDict,load_dataset
from transformers import AutoModelForSequenceClassification,AutoTokenizer


# Set kfold to train model

# In[5]:


kfold = 1


# Read kfold data into dataset

# In[6]:


raw_datasets = load_dataset("csv",data_files={'train': [f'{cleaned_data}/train/FAA-{kfold}.csv'], 'test': [f'{cleaned_data}/test/FAA-{kfold}.csv'],
                                                'val': [f'{cleaned_data}/val/FAA-{kfold}.csv']})


# In[7]:


raw_datasets


# In[8]:


raw_datasets['train'][0]


# Tokenize text column

# In[9]:


model_nm = "bert-base-cased"


# Create tokenizer

# In[10]:


tokz = AutoTokenizer.from_pretrained(model_nm)


# Tokenize inputs

# In[11]:


def tok_func(x):
    return tokz(x["text"], padding="max_length", truncation=True)

tokenized_datasets = raw_datasets.map(tok_func, batched=True)


# Define datasets for training

# In[12]:


full_train_dataset = tokenized_datasets["train"]
full_eval_dataset = tokenized_datasets["test"]
full_val_dataset = tokenized_datasets["val"]


# In[13]:


from transformers import DataCollatorWithPadding

data_collator = DataCollatorWithPadding(tokenizer=tokz)


# In[14]:


import numpy as np
import evaluate

accuracy = evaluate.load("accuracy")


def compute_metrics(eval_pred):
    predictions, labels = eval_pred
    predictions = np.argmax(predictions, axis=1)
    return accuracy.compute(predictions=predictions, references=labels)


# ## Train and Evaluate Model

# In[15]:


from transformers import AutoModelForSequenceClassification
from transformers import TrainingArguments, Trainer


# In[16]:


model = AutoModelForSequenceClassification.from_pretrained("bert-base-cased", num_labels=7)


# In[17]:


training_args = TrainingArguments(
    output_dir="../output/",
    learning_rate=5e-5,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    num_train_epochs=2,
    weight_decay=0.01,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
)


# In[18]:


trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=full_train_dataset,
    eval_dataset=full_eval_dataset,
    tokenizer=tokz,
    data_collator=data_collator,
    compute_metrics=compute_metrics,
)


# In[19]:


history = trainer.train()


# In[20]:


trainer.save_model("../output/model")

