import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brawlers } from './entities/brawlers.entity';
import { BrawlerStats } from './entities/brawler-stats.entity';
import { BattleService } from '~/utils/battle.service';
import { Maps } from '~/maps/entities/maps.entity';
import { AppConfigService } from '~/configs/app-config.service';

@Injectable()
export class BrawlersService {
  constructor(
    @InjectRepository(Brawlers)
    private brawlers: Repository<Brawlers>,
    @InjectRepository(BrawlerStats)
    private brawlerStats: Repository<BrawlerStats>,
    private readonly battleService: BattleService,
    private readonly appConfigService: AppConfigService,
  ) {}

  async getBrawler(id: string) {}

  async getBrawlers(): Promise<Brawlers[]> {
    return await this.brawlers.find({});
  }

  async getBrawlerTotalStats() {
    return await this.brawlerStats
      .createQueryBuilder('bs')
      .select('bs.brawlerID', 'brawlerID')
      .addSelect('bs.matchType', 'matchType')
      .addSelect(
        'SUM(bs.matchCount) * 100 / SUM(SUM(bs.matchCount)) OVER(PARTITION BY bs.matchType)',
        'pickRate',
      )
      .addSelect(
        'SUM(bs.victoryCount) * 100 / (SUM(bs.victoryCount) + SUM(bs.defeatCount))',
        'victoryRate',
      )
      .groupBy('bs.brawlerID')
      .addGroupBy('bs.matchType')
      .getRawMany();
  }

  async getBrawlerStatus(id: string) {}

  async getBrawlerStats() {
    return await this.brawlerStats
      .createQueryBuilder('bs')
      .select('bs.mapID', 'mapID')
      .addSelect('bs.brawlerID', 'brawlerID')
      .addSelect(
        'ROUND(SUM(bs.matchCount) * 100 / SUM(SUM(bs.matchCount)) OVER(PARTITION BY bs.mapID), 2)',
        'pickRate',
      )
      .addSelect(
        'ROUND(SUM(bs.victoryCount) * 100 / (SUM(bs.victoryCount) + SUM(bs.defeatCount)), 2)',
        'victoryRate',
      )
      .addSelect('b.name', 'brawlerName')
      .addSelect('m.mode', 'mode')
      .addSelect('m.name', 'mapName')
      .leftJoin('bs.brawler', 'b')
      .innerJoin(Maps, 'm', 'bs.mapID = m.mapID')
      .where('m.mode NOT IN (:modes)', {
        modes: [
          ...(await this.appConfigService.getModeClass()).duoModes,
          ...(await this.appConfigService.getModeClass()).soloModes.battle,
          ...(await this.appConfigService.getModeClass()).soloModes.survive,
        ],
      })
      .groupBy('bs.brawlerID')
      .addGroupBy('bs.mapID')
      .addGroupBy('b.name')
      .addGroupBy('m.mode')
      .addGroupBy('m.name')
      .orderBy('pickRate', 'DESC')
      .addOrderBy('victoryRate', 'DESC')
      .getRawMany();
  }
}
